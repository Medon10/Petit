import { Entity, Property, ManyToOne, OneToMany, Collection, type Rel, Cascade } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Order } from '../order/order.entity.js';
import { Product } from '../product/product.entity.js';
import { Variant } from '../variant/variant.entity.js';
import { OrderItemExtra } from '../order-item-extra/order-item-extra.entity.js';

@Entity({ tableName: 'order_items' })
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, { fieldName: 'order_id', deleteRule: 'cascade' })
  order!: Rel<Order>;

  @ManyToOne(() => Product, { fieldName: 'product_id' })
  product!: Rel<Product>;

  @ManyToOne(() => Variant, { fieldName: 'variant_id', nullable: true, deleteRule: 'set null' })
  variant?: Rel<Variant>;

  @Property({ default: 1 })
  quantity: number = 1;

  @Property({ fieldName: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: string;

  @Property({ fieldName: 'product_name' })
  productName!: string;

  @Property({ fieldName: 'variant_name', nullable: true })
  variantName?: string;

  @OneToMany(() => OrderItemExtra, (x) => x.orderItem, { cascade: [Cascade.ALL] })
  extras = new Collection<OrderItemExtra>(this);
}
