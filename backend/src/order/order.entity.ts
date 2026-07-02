import { Entity, Property, OneToMany, Collection, Enum, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { OrderItem } from '../order-item/order-item.entity.js';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum ShippingMethod {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
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

  @Enum({ items: () => ShippingMethod, fieldName: 'shipping_method' })
  shippingMethod: ShippingMethod = ShippingMethod.PICKUP;

  @Property({ fieldName: 'shipping_postal_code', nullable: true })
  shippingPostalCode?: string;

  @Property({ fieldName: 'shipping_address_line1', nullable: true })
  shippingAddressLine1?: string;

  @Property({ fieldName: 'shipping_address_line2', nullable: true })
  shippingAddressLine2?: string;

  @Property({ fieldName: 'shipping_city', nullable: true })
  shippingCity?: string;

  @Property({ fieldName: 'shipping_province', nullable: true })
  shippingProvince?: string;

  @Property({ fieldName: 'shipping_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: string = '0.00';

  @Enum({ items: () => OrderStatus })
  status: OrderStatus = OrderStatus.PENDING;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: string = '0.00';

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: string = '0.00';

  @Property({ fieldName: 'created_at', type: 'datetime', nullable: true, onCreate: () => new Date() })
  createdAt?: Date = new Date();

  @Property({ fieldName: 'updated_at', type: 'datetime', nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: [Cascade.ALL] })
  items = new Collection<OrderItem>(this);
}
