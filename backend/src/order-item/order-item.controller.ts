import { Request, Response } from 'express';
import { orm } from '../shared/bdd/orm.js';
import { OrderItem } from './order-item.entity.js';

async function findAll(req: Request, res: Response) {
  try {
    const em = orm.em.fork();

    const orderIdRaw = (req.query.order_id ?? req.query.orderId) as any;
    const orderId = orderIdRaw != null && String(orderIdRaw).trim() !== '' ? Number(orderIdRaw) : undefined;

    const where: any = {};
    if (orderId != null && !Number.isNaN(orderId)) where.order = orderId;

    const data = await em.find(OrderItem as any, where, {
      populate: ['product', 'variant', 'extras'] as any,
      orderBy: { id: 'DESC' } as any,
    } as any);

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener items del pedido', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(OrderItem as any, { id }, { populate: ['product', 'variant', 'extras'] as any } as any);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Item encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener item', error });
  }
}

export { findAll, findOne };
