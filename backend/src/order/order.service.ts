import { orm } from '../shared/bdd/orm.js';

import { Order, ShippingMethod } from './order.entity.js';
import { OrderItem } from '../order-item/order-item.entity.js';
import { OrderItemExtra } from '../order-item-extra/order-item-extra.entity.js';
import { OrderRepository } from './order.repository.js';
import { VariantComponent } from '../supply/variant-component.entity.js';
import { StockMovement, StockMovementType } from '../supply/stock-movement.entity.js';
import { sendLowStockNotification } from '../shared/mail/low-stock.mail.js';

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

function normalizeAndValidatePostalCode(raw: unknown) {
  const normalized = String(raw ?? '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');

  if (!/^[A-Z0-9]{4,8}$/.test(normalized)) {
    throw inputError('shipping_postal_code_invalid', 'Codigo postal invalido. Usa 4 a 8 caracteres alfanumericos.');
  }

  return normalized;
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
    // Costo de envio = 0. Se coordina por WhatsApp con el cliente.
    shippingCost = 0;
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

const VALID_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;

export async function updateOrderStatus(id: number, status: string) {
  if (!VALID_STATUSES.includes(status as any)) {
    throw new Error(`Estado inválido: ${status}. Valores válidos: ${VALID_STATUSES.join(', ')}`);
  }
  const em = orm.em.fork();
  const order = await em.findOne(Order as any, { id }, { populate: ['items', 'items.variant'] as any } as any);
  if (!order) return null;
  const o = order as any;
  o.status = status;

  // Fecha de ingreso (paid_at): primera vez que el pedido pasa a processing/completed.
  const now = new Date();
  if ((status === 'processing' || status === 'completed') && !o.paidAt) o.paidAt = now;
  if (status === 'pending') o.paidAt = null;
  // Fecha de finalización.
  if (status === 'completed') {
    if (!o.completedAt) o.completedAt = now;
  } else {
    o.completedAt = null;
  }

  // Descuento / Reversión de Stock:
  // Se descuenta cuando entra a 'processing' (o 'completed' directo) si no fue aplicado antes.
  const lowStockAlerts: Array<{ code: string; name: string; currentStock: number; threshold: number }> = [];

  if ((status === 'processing' || status === 'completed') && !o.stockAppliedAt) {
    const items = o.items?.getItems?.() || [];
    const variantIds = Array.from(
      new Set(items.map((item: any) => item.variant?.id).filter((vid: any): vid is number => Number.isFinite(vid)))
    );
    const components =
      variantIds.length > 0
        ? ((await em.find(
            VariantComponent as any,
            { variant: { $in: variantIds } },
            { populate: ['supply'] as any } as any
          )) as any[])
        : [];
    const componentByVariantId = new Map<number, any>();
    for (const comp of components) {
      const vid = comp.variant?.id ?? comp.variant;
      if (vid != null) componentByVariantId.set(Number(vid), comp);
    }

    let appliedAny = false;
    for (const item of items) {
      if (!item.variant?.id) continue;
      const component = componentByVariantId.get(Number(item.variant.id));
      if (component && component.supply) {
        const supply = component.supply;
        const prevStock = Number(supply.stock);
        const qtyToDeduct = (Number(component.quantity) || 1) * (Number(item.quantity) || 1);
        const newStock = prevStock - qtyToDeduct;
        supply.stock = newStock;
        appliedAny = true;
        em.create(StockMovement as any, {
          supply,
          delta: -qtyToDeduct,
          type: StockMovementType.SALE,
          order: o,
          note: `Pedido #${o.id} (${item.productName} - ${item.variantName || 'Estándar'} x${item.quantity})`,
        });

        // Alerta si llegó o cayó por debajo del punto de pedido (umbral):
        if (newStock <= Number(supply.lowStockThreshold) && prevStock > Number(supply.lowStockThreshold)) {
          const existingAlert = lowStockAlerts.find((a) => a.code === supply.code);
          if (existingAlert) {
            existingAlert.currentStock = newStock;
          } else {
            lowStockAlerts.push({
              code: supply.code,
              name: supply.name,
              currentStock: newStock,
              threshold: Number(supply.lowStockThreshold),
            });
          }
        }
      }
    }
    if (appliedAny) {
      o.stockAppliedAt = now;
    }
  } else if ((status === 'cancelled' || status === 'pending') && o.stockAppliedAt) {
    // Si se cancela o vuelve a pendiente y se había descontado el stock, revertir el saldo neto descontado en esta orden:
    const orderMovements = (await em.find(
      StockMovement as any,
      { order: o.id, type: { $in: [StockMovementType.SALE, StockMovementType.SALE_REVERSAL] } },
      { populate: ['supply'] as any } as any
    )) as any[];

    const netBySupply = new Map<number, { supply: any; netDelta: number }>();
    for (const mov of orderMovements) {
      if (!mov.supply?.id) continue;
      const sid = Number(mov.supply.id);
      const current = netBySupply.get(sid) || { supply: mov.supply, netDelta: 0 };
      current.netDelta += Number(mov.delta) || 0;
      netBySupply.set(sid, current);
    }

    for (const { supply, netDelta } of netBySupply.values()) {
      if (netDelta < 0) {
        const qtyToRestore = Math.abs(netDelta);
        supply.stock = Number(supply.stock) + qtyToRestore;
        em.create(StockMovement as any, {
          supply,
          delta: qtyToRestore,
          type: StockMovementType.SALE_REVERSAL,
          order: o,
          note: status === 'cancelled' ? `Cancelación de Pedido #${o.id}` : `Reversión a pendiente de Pedido #${o.id}`,
        });
      }
    }
    o.stockAppliedAt = null;
  }

  await em.flush();

  if (lowStockAlerts.length > 0) {
    sendLowStockNotification({
      orderId: o.id,
      customerName: o.customerName,
      pieces: lowStockAlerts,
    }).catch((err) => console.error('[mail] Error enviando alerta stock bajo:', err));
  }

  return await OrderRepository.populateOrder(em, id);
}
