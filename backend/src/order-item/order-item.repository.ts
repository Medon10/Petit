import type { EntityManager } from '@mikro-orm/core';

import { OrderItem } from './order-item.entity.js';

export class OrderItemRepository {
  static async listAll(em: EntityManager, where: any) {
    return await em.find(OrderItem as any, where, {
      populate: ['product', 'variant', 'extras'] as any,
      orderBy: { id: 'DESC' } as any,
    } as any);
  }

  static async findOne(em: EntityManager, id: number) {
    return await em.findOne(OrderItem as any, { id }, { populate: ['product', 'variant', 'extras'] as any } as any);
  }
}
