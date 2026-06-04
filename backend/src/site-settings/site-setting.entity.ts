import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';

@Entity({ tableName: 'site_settings' })
export class SiteSetting extends BaseEntity {
  @Property({ unique: true })
  key!: string;

  @Property({ type: 'text', nullable: true })
  value?: string;
}