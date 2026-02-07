import type { EntityManager } from '@mikro-orm/core';

import { AdminUser } from './admin-user.entity.js';

export class AdminRepository {
  static async findActiveAdminById(em: EntityManager, id: number) {
    return await em.findOne(AdminUser as any, { id, isActive: true } as any);
  }
}
