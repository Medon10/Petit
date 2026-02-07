import { Request, Response } from 'express';
import { findAllOrderItems, findOneOrderItem } from './order-item.service.js';

async function findAll(req: Request, res: Response) {
  try {
    const result = await findAllOrderItems({
      orderId: req.query.order_id ?? req.query.orderId,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener items del pedido', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await findOneOrderItem(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Item encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener item', error });
  }
}

export { findAll, findOne };
