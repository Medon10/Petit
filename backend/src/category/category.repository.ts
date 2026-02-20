import type { EntityManager } from '@mikro-orm/core';

import { Category } from './category.entity.js';

export class CategoryRepository {
  static async listAll(em: EntityManager, where: any) {
    return await em.find(Category as any, where, { orderBy: { name: 'ASC' } as any } as any);
  }

  static async findOneWithProducts(em: EntityManager, id: number) {
    return await em.findOne(Category as any, { id }, { populate: ['products'] as any } as any);
  }

  static async findOnePlain(em: EntityManager, id: number) {
    return await em.findOne(Category as any, { id });
  }

  static async representativeRows(em: EntityManager, options?: { includeInactive?: boolean }) {
    const whereClause = options?.includeInactive ? '1 = 1' : 'c.is_active = 1';
    const rows = await em.getConnection().execute(
      `
      SELECT
        c.id,
        c.name,
        c.is_active AS isActive,
        (
          SELECT p.image_url
          FROM products p
          WHERE p.category_id = c.id
            AND p.is_active = 1
            AND p.image_url IS NOT NULL
            AND p.image_url <> ''
          ORDER BY p.is_featured DESC, p.featured_rank ASC, p.id ASC
          LIMIT 1
        ) AS representativeImageUrl
      FROM categories c
      WHERE ${whereClause}
      ORDER BY c.name ASC
      `
    );

    return (rows as any[]).map((r) => ({
      id: Number(r.id),
      name: r.name,
      isActive: Boolean(r.isActive),
      representativeImageUrl: r.representativeImageUrl ?? null,
    }));
  }
}
