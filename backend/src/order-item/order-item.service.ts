import { orm } from '../shared/bdd/orm.js';
import { OrderItemRepository } from './order-item.repository.js';

export type OrderItemFilters = {
  orderId?: unknown;
};

export async function findAllOrderItems(filters: OrderItemFilters) {
  const em = orm.em.fork();

  const orderIdRaw = filters.orderId as any;
  const orderId = orderIdRaw != null && String(orderIdRaw).trim() !== '' ? Number(orderIdRaw) : undefined;

  const where: any = {};
  if (orderId != null && !Number.isNaN(orderId)) where.order = orderId;

  const data = await OrderItemRepository.listAll(em, where);
  return { data };
}

export async function findOneOrderItem(id: number) {
  const em = orm.em.fork();
  return await OrderItemRepository.findOne(em, id);
}
