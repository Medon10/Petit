import { Request, Response } from 'express';
import { createOrder as createOrderService, getOrderById, listOrders as listOrdersService } from './order.service.js';

async function createOrder(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const populated = await createOrderService(input);
    return res.status(201).json({ message: 'Pedido creado', data: populated });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al crear pedido' });
  }
}

async function listOrders(req: Request, res: Response) {
  try {
    const limit = (req.query.limit ?? req.query.take) as any;
    const result = await listOrdersService({ limit });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedidos', error });
  }
}

async function getOrder(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await getOrderById(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Pedido encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedido', error });
  }
}

export { createOrder, listOrders, getOrder };
