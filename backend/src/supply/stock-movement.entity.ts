import { Entity, Property, ManyToOne, Enum, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Supply } from './supply.entity.js';
import { Order } from '../order/order.entity.js';

export enum StockMovementType {
  INITIAL = 'initial',
  PURCHASE = 'purchase',
  SALE = 'sale',
  SALE_REVERSAL = 'sale_reversal',
  ADJUSTMENT = 'adjustment',
}

/**
 * Registro auditable de cada entrada, salida o ajuste en el inventario.
 */
@Entity({ tableName: 'stock_movements' })
export class StockMovement extends BaseEntity {
  @ManyToOne(() => Supply, { fieldName: 'supply_id', deleteRule: 'cascade' })
  supply!: Rel<Supply>;

  /** Cambio en el inventario (positivo para entradas/reversiones, negativo para ventas). */
  @Property()
  delta!: number;

  @Enum({ items: () => StockMovementType, fieldName: 'type' })
  type: StockMovementType = StockMovementType.ADJUSTMENT;

  @ManyToOne(() => Order, { fieldName: 'order_id', nullable: true, deleteRule: 'set null' })
  order?: Rel<Order> | null;

  @Property({ type: 'text', nullable: true })
  note?: string;

  @Property({ fieldName: 'created_at', type: 'datetime', nullable: true, onCreate: () => new Date() })
  createdAt?: Date = new Date();
}
