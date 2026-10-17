import { Entity, Property, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import type { VariantComponent } from './variant-component.entity.js';
import type { StockMovement } from './stock-movement.entity.js';

/**
 * Pieza o insumo base de inventario (ej. A1 Círculo 30mm, C9 Corazón 30mm).
 * El stock real se controla a este nivel.
 */
@Entity({ tableName: 'supplies' })
export class Supply extends BaseEntity {
  @Property({ unique: true })
  code!: string;

  @Property()
  name!: string;

  @Property({ default: 0 })
  stock: number = 0;

  @Property({ fieldName: 'low_stock_threshold', default: 5 })
  lowStockThreshold: number = 5;

  @Property({ fieldName: 'is_active', default: true })
  isActive: boolean = true;

  @Property({ fieldName: 'created_at', type: 'datetime', nullable: true, onCreate: () => new Date() })
  createdAt?: Date = new Date();

  @OneToMany('VariantComponent', 'supply')
  variantComponents = new Collection<VariantComponent>(this);

  @OneToMany('StockMovement', 'supply')
  movements = new Collection<StockMovement>(this);
}
