import { Request, Response } from 'express';
import { orm } from '../shared/bdd/orm.js';
import { OrderItemExtra } from './order-item-extra.entity.js';

async function findAll(req: Request, res: Response) {
  try {
    const em = orm.em.fork();

    const orderItemIdRaw = (req.query.order_item_id ?? req.query.orderItemId) as any;
    const orderItemId = orderItemIdRaw != null && String(orderItemIdRaw).trim() !== '' ? Number(orderItemIdRaw) : undefined;

    const where: any = {};
    if (orderItemId != null && !Number.isNaN(orderItemId)) where.orderItem = orderItemId;

    const data = await em.find(OrderItemExtra as any, where, {
      populate: ['extra', 'orderItem'] as any,
      orderBy: { id: 'DESC' } as any,
    } as any);

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener extras del item', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(OrderItemExtra as any, { id }, { populate: ['extra', 'orderItem'] as any } as any);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Extra de item encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener extra de item', error });
  }
}

export { findAll, findOne };
