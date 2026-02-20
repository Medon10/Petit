import { orm } from '../shared/bdd/orm.js';

import { Order } from './order.entity.js';
import { OrderItem } from '../order-item/order-item.entity.js';
import { OrderItemExtra } from '../order-item-extra/order-item-extra.entity.js';
import { OrderRepository } from './order.repository.js';

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
  items?: OrderItemInput[];
};

function toDecimalString(n: number) {
  // Keep 2 decimals for MySQL DECIMAL(10,2)
  return n.toFixed(2);
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.customer_name) throw new Error('customer_name es requerido');
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error('items es requerido');

  const em = orm.em.fork();

  const order = await em.transactional(async (tem) => {
    const o = tem.create(Order as any, {
      customerName: input.customer_name,
      customerEmail: input.customer_email,
      customerPhone: input.customer_phone,
      notes: input.notes,
      status: 'pending',
      total: '0.00',
    });

    let total = 0;

    for (const itemInput of input.items ?? []) {
      const productId = itemInput.product_id;
      const variantId = itemInput.variant_id;
      const quantity = itemInput.quantity != null ? Number(itemInput.quantity) : 1;

      if (!productId) throw new Error('product_id es requerido en items');
      if (!variantId) throw new Error('variant_id es requerido en items');
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('quantity inválido');

      const product = await OrderRepository.findProductOrThrow(tem, productId);
      const variant = await OrderRepository.findVariantOrThrow(tem, variantId, productId);

      const unitPrice = Number((variant as any).price);
      if (!Number.isFinite(unitPrice)) throw new Error('price inválido en variant');

      const oi = tem.create(OrderItem as any, {
        order: o,
        product,
        variant,
        quantity,
        unitPrice: toDecimalString(unitPrice),
        productName: String((product as any).name),
        variantName: String((variant as any).name),
      });

      total += unitPrice * quantity;

      const extras = Array.isArray(itemInput.extras) ? itemInput.extras : [];
      for (const extraInput of extras) {
        const extraId = extraInput.extra_id;
        const extraQty = extraInput.quantity != null ? Number(extraInput.quantity) : 1;

        if (!extraId) throw new Error('extra_id es requerido en extras');
        if (!Number.isFinite(extraQty) || extraQty <= 0) throw new Error('quantity inválido en extras');

        const extra = await OrderRepository.findExtraOrThrow(tem, extraId);

        const extraUnit = Number((extra as any).price);
        if (!Number.isFinite(extraUnit)) throw new Error('price inválido en extra');

        tem.create(OrderItemExtra as any, {
          orderItem: oi,
          extra,
          quantity: extraQty,
          unitPrice: toDecimalString(extraUnit),
          extraName: String((extra as any).name),
          categoryType: (extra as any).categoryType,
        });

        total += extraUnit * extraQty;
      }
    }

    (o as any).total = toDecimalString(total);
    await tem.flush();
    return o;
  });

  const populated = await OrderRepository.populateOrder(em, (order as any).id);
  return populated;
}

export async function listOrders(params: { limit?: unknown }) {
  const em = orm.em.fork();

  const limitRaw = params.limit as any;
  const limit = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 50;

  const data = await em.find(Order as any, {}, {
    orderBy: { id: 'DESC' } as any,
    limit: Number.isFinite(limit) ? Math.min(Math.max(1, limit), 200) : 50,
  } as any);

  return { data };
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
