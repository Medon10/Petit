import { orm } from '../shared/bdd/orm.js';

import { Order, ShippingMethod } from './order.entity.js';
import { OrderItem } from '../order-item/order-item.entity.js';
import { OrderItemExtra } from '../order-item-extra/order-item-extra.entity.js';
import { OrderRepository } from './order.repository.js';
import {
  ShippingQuoteError,
  normalizeAndValidatePostalCode,
  validateShippingQuoteForOrder,
} from '../shipping/shipping.service.js';

export type OrderItemExtraInput = {
  extra_id?: number;
  quantity?: number;
};

export type OrderItemInput = {
  product_id?: number;
  variant_id?: number;
  quantity?: number;
  extras?: OrderItemExtraInput[];
};

export type CreateOrderInput = {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  shipping?: {
    method?: string;
    postal_code?: string;
    postalCode?: string;
    quote_id?: string;
    quoteId?: string;
    address_line1?: string;
    addressLine1?: string;
    address_line2?: string;
    addressLine2?: string;
    city?: string;
    province?: string;
  };
  items?: OrderItemInput[];
};

function toDecimalString(n: number) {
  // Keep 2 decimals for NUMERIC(10,2)
  return n.toFixed(2);
}

function inputError(code: string, message: string) {
  const err = new Error(message) as Error & { code?: string };
  err.code = code;
  return err;
}

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function createOrder(input: CreateOrderInput) {
  const customerName = toTrimmedString(input.customer_name);
  if (!customerName) throw inputError('customer_name_required', 'customer_name es requerido');
  if (!Array.isArray(input.items) || input.items.length === 0) throw inputError('items_required', 'items es requerido');

  const shippingRaw = input.shipping || {};
  const shippingMethodRaw = toTrimmedString(shippingRaw.method).toLowerCase();
  const shippingMethod = shippingMethodRaw === ShippingMethod.DELIVERY ? ShippingMethod.DELIVERY : ShippingMethod.PICKUP;

  let shippingPostalCode: string | undefined;
  let shippingAddressLine1: string | undefined;
  let shippingAddressLine2: string | undefined;
  let shippingCity: string | undefined;
  let shippingProvince: string | undefined;
  let shippingCost = 0;
  let shippingProvider: string | undefined;
  let shippingService: string | undefined;
  let shippingQuoteId: string | undefined;
  let shippingQuoteExpiresAt: Date | undefined;
  let shippingEtaMinDays: number | undefined;
  let shippingEtaMaxDays: number | undefined;

  if (shippingMethod === ShippingMethod.DELIVERY) {
    shippingPostalCode = normalizeAndValidatePostalCode(shippingRaw.postal_code ?? shippingRaw.postalCode);
    shippingAddressLine1 = toTrimmedString(shippingRaw.address_line1 ?? shippingRaw.addressLine1);
    shippingAddressLine2 = toTrimmedString(shippingRaw.address_line2 ?? shippingRaw.addressLine2) || undefined;
    shippingCity = toTrimmedString(shippingRaw.city);
    shippingProvince = toTrimmedString(shippingRaw.province);

    if (!shippingAddressLine1) {
      throw inputError('shipping_address_line1_required', 'shipping.address_line1 es requerido para envio a domicilio.');
    }
    if (!shippingCity) {
      throw inputError('shipping_city_required', 'shipping.city es requerido para envio a domicilio.');
    }
    if (!shippingProvince) {
      throw inputError('shipping_province_required', 'shipping.province es requerido para envio a domicilio.');
    }

    try {
      const validatedQuote = validateShippingQuoteForOrder({
        quoteId: shippingRaw.quote_id ?? shippingRaw.quoteId,
        postalCode: shippingPostalCode,
        items: input.items,
      });

      shippingCost = validatedQuote.cost;
      shippingProvider = validatedQuote.provider;
      shippingService = validatedQuote.service;
      shippingQuoteId = validatedQuote.quoteId;
      shippingQuoteExpiresAt = validatedQuote.expiresAt;
      shippingEtaMinDays = validatedQuote.etaMinDays;
      shippingEtaMaxDays = validatedQuote.etaMaxDays;
    } catch (error: any) {
      if (error instanceof ShippingQuoteError) throw error;
      throw inputError('shipping_quote_invalid', 'No se pudo validar la cotizacion de envio.');
    }
  }

  const em = orm.em.fork();

  const order = await em.transactional(async (tem) => {
    const o = tem.create(Order as any, {
      customerName,
      customerEmail: input.customer_email,
      customerPhone: input.customer_phone,
      notes: input.notes,
      shippingMethod,
      shippingPostalCode: shippingMethod === ShippingMethod.DELIVERY ? shippingPostalCode : undefined,
      shippingAddressLine1: shippingMethod === ShippingMethod.DELIVERY ? shippingAddressLine1 : undefined,
      shippingAddressLine2: shippingMethod === ShippingMethod.DELIVERY ? shippingAddressLine2 : undefined,
      shippingCity: shippingMethod === ShippingMethod.DELIVERY ? shippingCity : undefined,
      shippingProvince: shippingMethod === ShippingMethod.DELIVERY ? shippingProvince : undefined,
      shippingProvider: shippingMethod === ShippingMethod.DELIVERY ? shippingProvider : undefined,
      shippingService: shippingMethod === ShippingMethod.DELIVERY ? shippingService : undefined,
      shippingQuoteId: shippingMethod === ShippingMethod.DELIVERY ? shippingQuoteId : undefined,
      shippingQuoteExpiresAt: shippingMethod === ShippingMethod.DELIVERY ? shippingQuoteExpiresAt : undefined,
      shippingEtaMinDays: shippingMethod === ShippingMethod.DELIVERY ? shippingEtaMinDays : undefined,
      shippingEtaMaxDays: shippingMethod === ShippingMethod.DELIVERY ? shippingEtaMaxDays : undefined,
      shippingCost: toDecimalString(shippingCost),
      status: 'pending',
      subtotal: '0.00',
      total: '0.00',
    });

    let subtotal = 0;

    for (const itemInput of input.items ?? []) {
      const productId = itemInput.product_id;
      const variantId = itemInput.variant_id;
      const quantity = itemInput.quantity != null ? Number(itemInput.quantity) : 1;

      if (!productId) throw inputError('items_product_required', 'product_id es requerido en items');
      if (!variantId) throw inputError('items_variant_required', 'variant_id es requerido en items');
      if (!Number.isFinite(quantity) || quantity <= 0) throw inputError('items_quantity_invalid', 'quantity invalido');

      const product = await OrderRepository.findProductOrThrow(tem, productId);
      const variant = await OrderRepository.findVariantOrThrow(tem, variantId, productId);

      const unitPrice = Number((variant as any).price);
      if (!Number.isFinite(unitPrice)) throw inputError('variant_price_invalid', 'price invalido en variant');

      const oi = tem.create(OrderItem as any, {
        order: o,
        product,
        variant,
        quantity,
        unitPrice: toDecimalString(unitPrice),
        productName: String((product as any).name),
        variantName: String((variant as any).name),
      });

      subtotal += unitPrice * quantity;

      const extras = Array.isArray(itemInput.extras) ? itemInput.extras : [];
      for (const extraInput of extras) {
        const extraId = extraInput.extra_id;
        const extraQty = extraInput.quantity != null ? Number(extraInput.quantity) : 1;

        if (!extraId) throw inputError('items_extra_required', 'extra_id es requerido en extras');
        if (!Number.isFinite(extraQty) || extraQty <= 0) throw inputError('items_extra_quantity_invalid', 'quantity invalido en extras');

        const extra = await OrderRepository.findExtraOrThrow(tem, extraId);

        const extraUnit = Number((extra as any).price);
        if (!Number.isFinite(extraUnit)) throw inputError('extra_price_invalid', 'price invalido en extra');

        tem.create(OrderItemExtra as any, {
          orderItem: oi,
          extra,
          quantity: extraQty,
          unitPrice: toDecimalString(extraUnit),
          extraName: String((extra as any).name),
          categoryType: (extra as any).categoryType,
        });

        subtotal += extraUnit * extraQty;
      }
    }

    const total = subtotal + shippingCost;
    (o as any).subtotal = toDecimalString(subtotal);
    (o as any).shippingCost = toDecimalString(shippingCost);
    (o as any).total = toDecimalString(total);
    await tem.flush();
    return o;
  });

  const populated = await OrderRepository.populateOrder(em, (order as any).id);
  return populated;
}

export async function listOrders(params: { limit?: unknown; page?: unknown; status?: unknown; q?: unknown }) {
  const em = orm.em.fork();

  const limitRaw = params.limit as any;
  const limit = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 50;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), 200) : 50;

  const pageRaw = params.page as any;
  const page = pageRaw != null && String(pageRaw).trim() !== '' ? Number(pageRaw) : 1;
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;

  const where: any = {};

  const status = String(params.status ?? '').trim();
  if (status) where.status = status;

  const q = String(params.q ?? '').trim();
  if (q) {
    const conditions: any[] = [
      { customerName: { $ilike: `%${q}%` } as any },
      { customerEmail: { $ilike: `%${q}%` } as any },
      { customerPhone: { $ilike: `%${q}%` } as any },
      { shippingPostalCode: { $ilike: `%${q}%` } as any },
    ];
    const numeric = Number(q);
    if (Number.isFinite(numeric)) {
      conditions.push({ id: numeric });
    }
    where.$and = [{ $or: conditions } as any];
  }

  const offset = (safePage - 1) * safeLimit;

  const [data, total] = await em.findAndCount(Order as any, where, {
    orderBy: { id: 'DESC' } as any,
    limit: safeLimit,
    offset,
  } as any);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return { data, total, page: safePage, totalPages };
}

export async function getOrderById(id: number) {
  const em = orm.em.fork();
  return await OrderRepository.populateOrder(em, id);
}

const VALID_STATUSES = ['pending', 'paid', 'cancelled', 'completed'] as const;

export async function updateOrderStatus(id: number, status: string) {
  if (!VALID_STATUSES.includes(status as any)) {
    throw new Error(`Estado inválido: ${status}. Valores válidos: ${VALID_STATUSES.join(', ')}`);
  }
  const em = orm.em.fork();
  const order = await em.findOne(Order as any, { id });
  if (!order) return null;
  (order as any).status = status;
  await em.flush();
  return await OrderRepository.populateOrder(em, id);
}
