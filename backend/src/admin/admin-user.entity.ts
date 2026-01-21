import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'admin_users' })
export class AdminUser {
  // Singleton: el único admin siempre es id=1
  @PrimaryKey({ type: Number, autoincrement: false })
  id: number = 1;

  @Property({ unique: true })
  username!: string;

  @Property({ fieldName: 'password_hash' })
  passwordHash!: string;

  @Property({ fieldName: 'is_active', default: true })
  isActive: boolean = true;

  @Property({ fieldName: 'created_at', type: 'datetime', nullable: true, onCreate: () => new Date() })
  createdAt?: Date = new Date();
}
