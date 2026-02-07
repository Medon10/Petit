import type { EntityManager } from '@mikro-orm/core';

import { Variant } from './variant.entity.js';
import { Product } from '../product/product.entity.js';

export class VariantRepository {
  static async listAll(em: EntityManager, where: any) {
    return await em.find(Variant as any, where, {
      populate: ['product'] as any,
      orderBy: { id: 'ASC' } as any,
    } as any);
  }

  static async findOne(em: EntityManager, id: number) {
    return await em.findOne(Variant as any, { id }, { populate: ['product'] as any } as any);
  }

  static async findOnePlain(em: EntityManager, id: number) {
    return await em.findOne(Variant as any, { id });
  }

  static async findProductOrThrow(em: EntityManager, productId: number) {
    const product = await em.findOne(Product as any, { id: productId });
    if (!product) throw new Error('product_id inválido');
    return product as any;
  }
}
