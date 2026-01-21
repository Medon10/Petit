import { Request, Response } from 'express';
import { orm } from '../shared/bdd/orm.js';
import { Order } from './order.entity.js';
import { OrderItem } from '../order-item/order-item.entity.js'
import { OrderItemExtra } from '../order-item-extra/order-item-extra.entity.js'
import { Product } from '../product/product.entity.js';
import { Variant } from '../variant/variant.entity.js';
import { Extra } from '../extra/extra.entity.js';

function toDecimalString(n: number) {
  // Keep 2 decimals for MySQL DECIMAL(10,2)
  return n.toFixed(2);
}

async function createOrder(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;

    if (!input.customer_name) return res.status(400).json({ message: 'customer_name es requerido' });
    if (!Array.isArray(input.items) || input.items.length === 0) return res.status(400).json({ message: 'items es requerido' });

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

      for (const itemInput of input.items) {
        const productId = itemInput.product_id;
        const variantId = itemInput.variant_id;
        const quantity = itemInput.quantity != null ? Number(itemInput.quantity) : 1;

        if (!productId) throw new Error('product_id es requerido en items');
        if (!variantId) throw new Error('variant_id es requerido en items');
        if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('quantity inválido');

        const product = await tem.findOne(Product as any, { id: productId });
        if (!product) throw new Error(`product_id inválido: ${productId}`);

        const variant = await tem.findOne(Variant as any, { id: variantId, product: productId } as any);
        if (!variant) throw new Error(`variant_id inválido para product_id=${productId}`);

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

          const extra = await tem.findOne(Extra as any, { id: extraId });
          if (!extra) throw new Error(`extra_id inválido: ${extraId}`);

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

    const populated = await em.findOne(Order as any, { id: (order as any).id }, { populate: ['items', 'items.extras'] as any } as any);
    return res.status(201).json({ message: 'Pedido creado', data: populated });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al crear pedido' });
  }
}

async function listOrders(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const limitRaw = (req.query.limit ?? req.query.take) as any;
    const limit = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 50;

    const data = await em.find(Order as any, {}, {
      orderBy: { id: 'DESC' } as any,
      limit: Number.isFinite(limit) ? Math.min(Math.max(1, limit), 200) : 50,
    } as any);

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedidos', error });
  }
}

async function getOrder(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Order as any, { id }, { populate: ['items', 'items.extras'] as any } as any);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Pedido encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedido', error });
  }
}

export { createOrder, listOrders, getOrder };
