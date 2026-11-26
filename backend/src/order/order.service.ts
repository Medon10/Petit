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

export type UpdateOrderItemExtraInput = {
  id?: number;
  extra_id?: number | null;
  quantity?: number;
};

export type UpdateOrderItemInput = {
  id?: number;
  product_id?: number;
  variant_id?: number | null;
  quantity?: number;
  extras?: UpdateOrderItemExtraInput[];
};

export type UpdateOrderInput = {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  shipping?: {
    method?: string;
    postal_code?: string;
    postalCode?: string;
    address_line1?: string;
    addressLine1?: string;
    address_line2?: string;
    addressLine2?: string;
    city?: string;
    province?: string;
  };
  items?: UpdateOrderItemInput[];
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
      paymentStatus: 'unpaid',
      paidAmount: '0.00',
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

export async function listOrders(params: { limit?: unknown; page?: unknown; status?: unknown; paymentStatus?: unknown; q?: unknown }) {
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

  const paymentStatus = String(params.paymentStatus ?? '').trim();
  if (paymentStatus) where.paymentStatus = paymentStatus;

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

type LowStockAlert = { code: string; name: string; currentStock: number; threshold: number };

function recordLowStockAlert(
  alerts: LowStockAlert[],
  supply: any,
  prevStock: number,
  newStock: number
) {
  const threshold = Number(supply.lowStockThreshold);
  if (newStock <= threshold && prevStock > threshold) {
    const existing = alerts.find((a) => a.code === supply.code);
    if (existing) {
      existing.currentStock = newStock;
    } else {
      alerts.push({
        code: supply.code,
        name: supply.name,
        currentStock: newStock,
        threshold,
      });
    }
  }
}

async function loadVariantComponentsByVariantId(em: any, variantIds: number[]) {
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
  return componentByVariantId;
}

async function getNetOrderStockBySupply(em: any, orderId: number) {
  const orderMovements = (await em.find(
    StockMovement as any,
    { order: orderId, type: { $in: [StockMovementType.SALE, StockMovementType.SALE_REVERSAL] } },
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
  return netBySupply;
}

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
  const lowStockAlerts: LowStockAlert[] = [];

  if ((status === 'processing' || status === 'completed') && !o.stockAppliedAt) {
    const items = o.items?.getItems?.() || [];
    const variantIds = Array.from(
      new Set<number>(items.map((item: any) => item.variant?.id).filter((vid: any): vid is number => Number.isFinite(vid)))
    );
    const componentByVariantId = await loadVariantComponentsByVariantId(em, variantIds);

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
        recordLowStockAlert(lowStockAlerts, supply, prevStock, newStock);
      }
    }
    if (appliedAny) {
      o.stockAppliedAt = now;
    }
  } else if ((status === 'cancelled' || status === 'pending') && o.stockAppliedAt) {
    // Si se cancela o vuelve a pendiente y se había descontado el stock, revertir el saldo neto descontado en esta orden:
    const netBySupply = await getNetOrderStockBySupply(em, o.id);

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

type ExistingExtraSnap = {
  id: number;
  extraId: number | null;
  unitPrice: number;
  extraName: string;
  categoryType: any;
};

type ExistingItemSnap = {
  id: number;
  productId: number;
  variantId: number | null;
  unitPrice: number;
  productName: string;
  variantName?: string;
  extrasById: Map<number, ExistingExtraSnap>;
};

export async function updateOrder(id: number, input: UpdateOrderInput) {
  const customerName = toTrimmedString(input.customer_name);
  if (!customerName) throw inputError('customer_name_required', 'customer_name es requerido');
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw inputError('items_required', 'El pedido debe tener al menos un ítem');
  }

  const shippingRaw = input.shipping || {};
  const shippingMethodRaw = toTrimmedString(shippingRaw.method).toLowerCase();
  const shippingMethod = shippingMethodRaw === ShippingMethod.DELIVERY ? ShippingMethod.DELIVERY : ShippingMethod.PICKUP;

  let shippingPostalCode: string | undefined;
  let shippingAddressLine1: string | undefined;
  let shippingAddressLine2: string | undefined;
  let shippingCity: string | undefined;
  let shippingProvince: string | undefined;

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
  }

  const em = orm.em.fork();
  const lowStockAlerts: LowStockAlert[] = [];

  const txResult = await em.transactional(async (tem) => {
    const order = await tem.findOne(
      Order as any,
      { id },
      { populate: ['items', 'items.product', 'items.variant', 'items.extras', 'items.extras.extra'] as any } as any
    );
    if (!order) return null;

    const o = order as any;
    if (o.status === 'cancelled') {
      throw inputError('order_cancelled', 'No se puede modificar un pedido cancelado.');
    }
    if (o.status === 'completed') {
      throw inputError('order_completed', 'No se puede modificar un pedido completado. Pasalo a "En proceso" primero si necesitás corregirlo.');
    }

    const oldTotal = Number(o.total) || 0;
    const oldPaymentStatus = String(o.paymentStatus || 'unpaid');
    const oldPaidAmount =
      oldPaymentStatus === 'paid'
        ? (Number(o.paidAmount) > 0 ? Number(o.paidAmount) : oldTotal)
        : oldPaymentStatus === 'deposit'
          ? (Number(o.paidAmount) || 0)
          : 0;

    const existingItems = (o.items?.getItems?.() || []) as any[];
    const existingItemsById = new Map<number, ExistingItemSnap>();
    for (const oi of existingItems) {
      const extrasById = new Map<number, ExistingExtraSnap>();
      for (const ex of (oi.extras?.getItems?.() || []) as any[]) {
        extrasById.set(Number(ex.id), {
          id: Number(ex.id),
          extraId: ex.extra?.id != null ? Number(ex.extra.id) : (ex.extra != null ? Number(ex.extra) : null),
          unitPrice: Number(ex.unitPrice) || 0,
          extraName: String(ex.extraName),
          categoryType: ex.categoryType,
        });
      }
      existingItemsById.set(Number(oi.id), {
        id: Number(oi.id),
        productId: Number(oi.product?.id ?? oi.product),
        variantId: oi.variant?.id != null ? Number(oi.variant.id) : (oi.variant != null ? Number(oi.variant) : null),
        unitPrice: Number(oi.unitPrice) || 0,
        productName: String(oi.productName),
        variantName: oi.variantName,
        extrasById,
      });
    }

    // Remove existing items/extras explicitly (orphanRemoval is not enabled on Order.items)
    for (const oi of existingItems) {
      const existingExtras = (oi.extras?.getItems?.() || []) as any[];
      for (const ex of existingExtras) {
        tem.remove(ex);
      }
      tem.remove(oi);
    }
    o.items?.removeAll?.();
    await tem.flush();

    let subtotal = 0;
    const createdItems: Array<{ variantId: number | null; quantity: number }> = [];

    for (const itemInput of input.items ?? []) {
      const quantity = itemInput.quantity != null ? Number(itemInput.quantity) : 1;
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw inputError('items_quantity_invalid', 'quantity inválido en items (debe ser un entero >= 1)');
      }

      const prevItem = itemInput.id != null ? existingItemsById.get(Number(itemInput.id)) : undefined;

      let product: any;
      let variant: any = null;
      let unitPrice: number;
      let productName: string;
      let variantName: string | undefined;

      const isPreservedNullVariant =
        prevItem != null &&
        prevItem.variantId == null &&
        itemInput.variant_id == null &&
        (itemInput.product_id == null || Number(itemInput.product_id) === prevItem.productId);

      const isPreservedCatalogVariant =
        prevItem != null &&
        prevItem.variantId != null &&
        Number(itemInput.product_id) === prevItem.productId &&
        Number(itemInput.variant_id) === prevItem.variantId;

      if (isPreservedNullVariant && prevItem) {
        product = await OrderRepository.findProductByIdOrThrow(tem, prevItem.productId);
        variant = null;
        unitPrice = prevItem.unitPrice;
        productName = prevItem.productName;
        variantName = prevItem.variantName;
      } else if (isPreservedCatalogVariant && prevItem && prevItem.variantId != null) {
        product = await OrderRepository.findProductByIdOrThrow(tem, prevItem.productId);
        variant = await OrderRepository.findVariantByIdOrThrow(tem, prevItem.variantId, prevItem.productId);
        unitPrice = prevItem.unitPrice;
        productName = prevItem.productName;
        variantName = prevItem.variantName;
      } else {
        const productId = itemInput.product_id;
        const variantId = itemInput.variant_id;
        if (!productId) throw inputError('items_product_required', 'product_id es requerido en items');
        if (!variantId) throw inputError('items_variant_required', 'variant_id es requerido en items');

        product = await OrderRepository.findProductOrThrow(tem, productId);
        variant = await OrderRepository.findVariantOrThrow(tem, variantId, productId);
        unitPrice = Number(variant.price);
        if (!Number.isFinite(unitPrice)) throw inputError('variant_price_invalid', 'price invalido en variant');
        productName = String(product.name);
        variantName = String(variant.name);
      }

      const oi = tem.create(OrderItem as any, {
        order: o,
        product,
        variant,
        quantity,
        unitPrice: toDecimalString(unitPrice),
        productName,
        variantName,
      });

      subtotal += unitPrice * quantity;
      createdItems.push({ variantId: variant ? Number(variant.id) : null, quantity });

      const extras = Array.isArray(itemInput.extras) ? itemInput.extras : [];
      for (const extraInput of extras) {
        const extraQty = extraInput.quantity != null ? Number(extraInput.quantity) : 1;
        if (!Number.isInteger(extraQty) || extraQty <= 0) {
          throw inputError('items_extra_quantity_invalid', 'quantity inválido en extras (debe ser un entero >= 1)');
        }

        const prevExtra =
          prevItem && extraInput.id != null ? prevItem.extrasById.get(Number(extraInput.id)) : undefined;

        let extra: any = null;
        let extraUnit: number;
        let extraName: string;
        let categoryType: any;

        const isPreservedNullExtra =
          prevExtra != null && prevExtra.extraId == null && extraInput.extra_id == null;

        const isPreservedCatalogExtra =
          prevExtra != null &&
          prevExtra.extraId != null &&
          Number(extraInput.extra_id) === prevExtra.extraId;

        if (isPreservedNullExtra && prevExtra) {
          extra = null;
          extraUnit = prevExtra.unitPrice;
          extraName = prevExtra.extraName;
          categoryType = prevExtra.categoryType;
        } else if (isPreservedCatalogExtra && prevExtra && prevExtra.extraId != null) {
          extra = await OrderRepository.findExtraOrThrow(tem, prevExtra.extraId);
          extraUnit = prevExtra.unitPrice;
          extraName = prevExtra.extraName;
          categoryType = prevExtra.categoryType;
        } else {
          const extraId = extraInput.extra_id;
          if (!extraId) throw inputError('items_extra_required', 'extra_id es requerido en extras');
          extra = await OrderRepository.findActiveExtraOrThrow(tem, extraId);
          extraUnit = Number(extra.price);
          if (!Number.isFinite(extraUnit)) throw inputError('extra_price_invalid', 'price invalido en extra');
          extraName = String(extra.name);
          categoryType = extra.categoryType;
        }

        tem.create(OrderItemExtra as any, {
          orderItem: oi,
          extra,
          quantity: extraQty,
          unitPrice: toDecimalString(extraUnit),
          extraName,
          categoryType,
        });

        subtotal += extraUnit * extraQty;
      }
    }

    o.customerName = customerName;
    o.customerEmail = toTrimmedString(input.customer_email) || null;
    o.customerPhone = toTrimmedString(input.customer_phone) || null;
    o.notes = typeof input.notes === 'string' && input.notes.trim() !== '' ? input.notes.trim() : null;
    o.shippingMethod = shippingMethod;

    if (shippingMethod === ShippingMethod.DELIVERY) {
      o.shippingPostalCode = shippingPostalCode;
      o.shippingAddressLine1 = shippingAddressLine1;
      o.shippingAddressLine2 = shippingAddressLine2 || null;
      o.shippingCity = shippingCity;
      o.shippingProvince = shippingProvince;
    } else {
      o.shippingPostalCode = null;
      o.shippingAddressLine1 = null;
      o.shippingAddressLine2 = null;
      o.shippingCity = null;
      o.shippingProvince = null;
    }

    const shippingCost = Number(o.shippingCost) || 0;
    const newTotal = Math.round((subtotal + shippingCost) * 100) / 100;
    o.subtotal = toDecimalString(subtotal);
    o.total = toDecimalString(newTotal);
    o.updatedAt = new Date();

    const warnings: string[] = [];
    if (oldPaymentStatus === 'unpaid') {
      o.paymentStatus = 'unpaid';
      o.paidAmount = '0.00';
    } else if (oldPaymentStatus === 'paid') {
      if (newTotal > oldPaidAmount + 0.001) {
        const remaining = Math.round((newTotal - oldPaidAmount) * 100) / 100;
        o.paymentStatus = 'deposit';
        o.paidAmount = toDecimalString(oldPaidAmount);
        warnings.push(
          `El total subió de $${oldPaidAmount.toFixed(2)} a $${newTotal.toFixed(2)}. El pago pasó a "Seña" (abonó $${oldPaidAmount.toFixed(2)}, resta pagar $${remaining.toFixed(2)}).`
        );
      } else if (newTotal < oldPaidAmount - 0.001) {
        const credit = Math.round((oldPaidAmount - newTotal) * 100) / 100;
        o.paymentStatus = 'paid';
        o.paidAmount = toDecimalString(newTotal);
        warnings.push(
          `El nuevo total ($${newTotal.toFixed(2)}) es menor al monto ya abonado ($${oldPaidAmount.toFixed(2)}). Hay $${credit.toFixed(2)} a favor del cliente.`
        );
      } else {
        o.paymentStatus = 'paid';
        o.paidAmount = toDecimalString(newTotal);
      }
    } else if (oldPaymentStatus === 'deposit') {
      if (newTotal < oldPaidAmount - 0.001) {
        const credit = Math.round((oldPaidAmount - newTotal) * 100) / 100;
        o.paymentStatus = 'paid';
        o.paidAmount = toDecimalString(newTotal);
        warnings.push(
          `La seña abonada ($${oldPaidAmount.toFixed(2)}) supera el nuevo total ($${newTotal.toFixed(2)}). El pedido quedó como "Pagado" con $${credit.toFixed(2)} a favor del cliente.`
        );
      } else if (Math.abs(newTotal - oldPaidAmount) <= 0.001) {
        o.paymentStatus = 'paid';
        o.paidAmount = toDecimalString(newTotal);
      } else {
        o.paymentStatus = 'deposit';
        o.paidAmount = toDecimalString(oldPaidAmount);
      }
    }

    // Stock reconciliation when order is processing or already had stock applied
    if (o.status === 'processing' || o.stockAppliedAt != null) {
      const currentNetBySupply = await getNetOrderStockBySupply(tem, o.id);
      const uniqueVariantIds = Array.from(
        new Set<number>(
          createdItems
            .map((it) => it.variantId)
            .filter((vid): vid is number => vid != null && Number.isFinite(vid))
        )
      );
      const componentByVariantId = await loadVariantComponentsByVariantId(tem, uniqueVariantIds);

      const desiredNetBySupply = new Map<number, { supply: any; desiredNet: number }>();
      for (const item of createdItems) {
        if (item.variantId == null) continue;
        const comp = componentByVariantId.get(item.variantId);
        if (!comp || !comp.supply) continue;
        const sid = Number(comp.supply.id);
        const qtyToDeduct = (Number(comp.quantity) || 1) * item.quantity;
        const entry = desiredNetBySupply.get(sid) || { supply: comp.supply, desiredNet: 0 };
        entry.desiredNet -= qtyToDeduct;
        desiredNetBySupply.set(sid, entry);
      }

      const allSupplyIds = new Set<number>([
        ...currentNetBySupply.keys(),
        ...desiredNetBySupply.keys(),
      ]);

      for (const sid of allSupplyIds) {
        const currentEntry = currentNetBySupply.get(sid);
        const desiredEntry = desiredNetBySupply.get(sid);
        const currentNet = currentEntry ? currentEntry.netDelta : 0;
        const desiredNet = desiredEntry ? desiredEntry.desiredNet : 0;
        const diff = desiredNet - currentNet;
        if (diff === 0) continue;

        const supply = desiredEntry?.supply ?? currentEntry?.supply;
        if (!supply) continue;

        const prevStock = Number(supply.stock);
        const newStock = prevStock + diff;
        supply.stock = newStock;

        tem.create(StockMovement as any, {
          supply,
          delta: diff,
          type: diff < 0 ? StockMovementType.SALE : StockMovementType.SALE_REVERSAL,
          order: o,
          note:
            diff < 0
              ? `Modificación de Pedido #${o.id} (descuento adicional)`
              : `Modificación de Pedido #${o.id} (devolución de stock)`,
        });

        if (diff < 0) {
          recordLowStockAlert(lowStockAlerts, supply, prevStock, newStock);
        }
      }

      o.stockAppliedAt = desiredNetBySupply.size > 0 ? (o.stockAppliedAt ?? new Date()) : null;
    }

    await tem.flush();
    return { warnings };
  });

  if (!txResult) return null;

  if (lowStockAlerts.length > 0) {
    sendLowStockNotification({
      orderId: id,
      customerName,
      pieces: lowStockAlerts,
    }).catch((err) => console.error('[mail] Error enviando alerta stock bajo:', err));
  }

  return {
    order: await OrderRepository.populateOrder(em, id),
    warnings: txResult.warnings,
  };
}

const VALID_PAYMENT_STATUSES = ['unpaid', 'deposit', 'paid'] as const;

export async function updateOrderPayment(
  id: number,
  input: { paymentStatus?: unknown; paidAmount?: unknown }
) {
  const paymentStatus = String(input.paymentStatus ?? '').trim();
  if (!VALID_PAYMENT_STATUSES.includes(paymentStatus as any)) {
    throw new Error(`Estado de pago inválido: ${paymentStatus}`);
  }
  const em = orm.em.fork();
  const order = await em.findOne(Order as any, { id });
  if (!order) return null;
  const o = order as any;
  const totalNum = Number(o.total) || 0;

  if (paymentStatus === 'unpaid') {
    o.paymentStatus = 'unpaid';
    o.paidAmount = '0.00';
  } else if (paymentStatus === 'paid') {
    o.paymentStatus = 'paid';
    o.paidAmount = toDecimalString(totalNum);
    if (!o.paidAt) o.paidAt = new Date();
  } else if (paymentStatus === 'deposit') {
    const rawAmount = Number(input.paidAmount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      throw new Error('Ingresá un monto de seña válido mayor a $0');
    }
    if (totalNum > 0 && rawAmount > totalNum) {
      throw new Error('El monto de la seña no puede superar el total del pedido');
    }
    if (totalNum > 0 && rawAmount === totalNum) {
      o.paymentStatus = 'paid';
      o.paidAmount = toDecimalString(totalNum);
    } else {
      o.paymentStatus = 'deposit';
      o.paidAmount = toDecimalString(rawAmount);
    }
    if (!o.paidAt) o.paidAt = new Date();
  }

  await em.flush();
  return await OrderRepository.populateOrder(em, id);
}
