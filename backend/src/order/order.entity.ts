import { Entity, Property, OneToMany, Collection, Enum, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { OrderItem } from '../order-item/order-item.entity.js';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity({ tableName: 'orders' })
export class Order extends BaseEntity {
  @Property({ fieldName: 'customer_name' })
  customerName!: string;

  @Property({ fieldName: 'customer_email', nullable: true })
  customerEmail?: string;

  @Property({ fieldName: 'customer_phone', nullable: true })
  customerPhone?: string;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Enum({ items: () => OrderStatus })
  status: OrderStatus = OrderStatus.PENDING;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: string = '0.00';

  @Property({ fieldName: 'created_at', type: 'datetime', nullable: true, onCreate: () => new Date() })
  createdAt?: Date = new Date();

  @Property({ fieldName: 'updated_at', type: 'datetime', nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: [Cascade.ALL] })
  items = new Collection<OrderItem>(this);
}
