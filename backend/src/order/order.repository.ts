import type { EntityManager } from '@mikro-orm/core';

import { Order } from './order.entity.js';
import { Product } from '../product/product.entity.js';
import { Variant } from '../variant/variant.entity.js';
import { Extra } from '../extra/extra.entity.js';

export class OrderRepository {
  static async findProductOrThrow(em: EntityManager, productId: number) {
    const product = await em.findOne(Product as any, { id: productId });
    if (!product) throw new Error(`product_id inválido: ${productId}`);
    return product as any;
  }

  static async findVariantOrThrow(em: EntityManager, variantId: number, productId: number) {
    const variant = await em.findOne(Variant as any, { id: variantId, product: productId } as any);
    if (!variant) throw new Error(`variant_id inválido para product_id=${productId}`);
    return variant as any;
  }

  static async findExtraOrThrow(em: EntityManager, extraId: number) {
    const extra = await em.findOne(Extra as any, { id: extraId });
    if (!extra) throw new Error(`extra_id inválido: ${extraId}`);
    return extra as any;
  }

  static async populateOrder(em: EntityManager, id: number) {
    return await em.findOne(
      Order as any,
      { id },
      {
        populate: ['items', 'items.extras'] as any,
      } as any
    );
  }
}
