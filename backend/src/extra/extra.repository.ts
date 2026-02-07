import type { EntityManager } from '@mikro-orm/core';

import { Extra } from './extra.entity.js';

export class ExtraRepository {
  static async listAll(em: EntityManager, where: any) {
    return await em.find(Extra as any, where, { orderBy: { name: 'ASC' } as any } as any);
  }

  static async findOne(em: EntityManager, id: number) {
    return await em.findOne(Extra as any, { id });
  }
}
