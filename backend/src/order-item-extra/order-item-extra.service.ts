import { orm } from '../shared/bdd/orm.js';
import { OrderItemExtraRepository } from './order-item-extra.repository.js';

export type OrderItemExtraFilters = {
  orderItemId?: unknown;
};

export async function findAllOrderItemExtras(filters: OrderItemExtraFilters) {
  const em = orm.em.fork();

  const orderItemIdRaw = filters.orderItemId as any;
  const orderItemId = orderItemIdRaw != null && String(orderItemIdRaw).trim() !== '' ? Number(orderItemIdRaw) : undefined;

  const where: any = {};
  if (orderItemId != null && !Number.isNaN(orderItemId)) where.orderItem = orderItemId;

  const data = await OrderItemExtraRepository.listAll(em, where);
  return { data };
}

export async function findOneOrderItemExtra(id: number) {
  const em = orm.em.fork();
  return await OrderItemExtraRepository.findOne(em, id);
}
