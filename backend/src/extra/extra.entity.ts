import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';

export enum ExtraCategoryType {
  GENERAL = 'general',
  DIJE = 'dije',
  CADENA = 'cadena',
  SERVICIO = 'servicio',
}

@Entity({ tableName: 'extras' })
export class Extra extends BaseEntity {
  @Property()
  name!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Enum({ items: () => ExtraCategoryType, fieldName: 'category_type' })
  categoryType: ExtraCategoryType = ExtraCategoryType.GENERAL;
}
