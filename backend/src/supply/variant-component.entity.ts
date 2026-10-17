import { Entity, Property, ManyToOne, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Variant } from '../variant/variant.entity.js';
import { Supply } from './supply.entity.js';

/**
 * Vinculación entre una variante vendida en la web y la pieza de inventario que consume.
 * Por defecto 1 variante = 1 pieza (quantity = 1).
 */
@Entity({ tableName: 'variant_components' })
export class VariantComponent extends BaseEntity {
  @ManyToOne(() => Variant, { fieldName: 'variant_id', deleteRule: 'cascade' })
  variant!: Rel<Variant>;

  @ManyToOne(() => Supply, { fieldName: 'supply_id', deleteRule: 'cascade' })
  supply!: Rel<Supply>;

  @Property({ default: 1 })
  quantity: number = 1;
}
