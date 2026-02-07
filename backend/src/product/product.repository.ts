import type { EntityManager } from '@mikro-orm/core';

import { Product } from './product.entity.js';
import { Category } from '../category/category.entity.js';

export class ProductRepository {
  static async findCategoryOrThrow(em: EntityManager, categoryId: number) {
    const category = await em.findOne(Category as any, { id: categoryId });
    if (!category) throw new Error('categoria inválida');
    return category as any;
  }

  static async findProduct(em: EntityManager, id: number) {
    return await em.findOne(Product as any, { id }, { populate: ['category', 'variants'] as any } as any);
  }

  static async findProductPlain(em: EntityManager, id: number) {
    return await em.findOne(Product as any, { id });
  }

  static async listProducts(em: EntityManager, where: any, options: any) {
    return await em.find(Product as any, where, options as any);
  }

  static async bestSellerIds(em: EntityManager, limit: number) {
    const rows = await em.getConnection().execute(
      'SELECT product_id, SUM(quantity) AS qty FROM order_items GROUP BY product_id ORDER BY qty DESC LIMIT ?',
      [limit]
    );

    return (rows as any[]).map((r) => Number(r.product_id)).filter((n) => Number.isFinite(n));
  }
}
