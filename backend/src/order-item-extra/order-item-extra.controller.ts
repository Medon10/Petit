import { Request, Response } from 'express';
import { findAllOrderItemExtras, findOneOrderItemExtra } from './order-item-extra.service.js';

async function findAll(req: Request, res: Response) {
  try {
    const result = await findAllOrderItemExtras({
      orderItemId: req.query.order_item_id ?? req.query.orderItemId,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener extras del item', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await findOneOrderItemExtra(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Extra de item encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener extra de item', error });
  }
}

export { findAll, findOne };
