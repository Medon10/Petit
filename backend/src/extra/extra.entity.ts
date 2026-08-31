import { Entity, Property, Enum, OneToMany, Collection } from '@mikro-orm/core';
import type { ExtraScope } from './extra-scope.entity.js';
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

  @Property({ fieldName: 'is_active', default: true })
  isActive: boolean = true;

  /** Asignaciones de productos/categorías donde aplica este extra.
   * Si está vacío → aplica a TODOS los productos (global). */
  @OneToMany('ExtraScope', 'extra')
  scopes = new Collection<ExtraScope>(this);
}
