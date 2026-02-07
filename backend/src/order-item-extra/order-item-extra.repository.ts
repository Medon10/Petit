import type { EntityManager } from '@mikro-orm/core';

import { OrderItemExtra } from './order-item-extra.entity.js';

export class OrderItemExtraRepository {
  static async listAll(em: EntityManager, where: any) {
    return await em.find(OrderItemExtra as any, where, {
      populate: ['extra', 'orderItem'] as any,
      orderBy: { id: 'DESC' } as any,
    } as any);
  }

  static async findOne(em: EntityManager, id: number) {
    return await em.findOne(OrderItemExtra as any, { id }, { populate: ['extra', 'orderItem'] as any } as any);
  }
}
