import { Entity, Property, ManyToOne, Enum, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { OrderItem } from '../order-item/order-item.entity.js';
import { Extra, ExtraCategoryType } from '../extra/extra.entity.js';

@Entity({ tableName: 'order_item_extras' })
export class OrderItemExtra extends BaseEntity {
  @ManyToOne(() => OrderItem, { fieldName: 'order_item_id', deleteRule: 'cascade' })
  orderItem!: Rel<OrderItem>;

  @ManyToOne(() => Extra, { fieldName: 'extra_id', nullable: true, deleteRule: 'set null' })
  extra?: Rel<Extra>;

  @Property({ default: 1 })
  quantity: number = 1;

  @Property({ fieldName: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: string;

  @Property({ fieldName: 'extra_name' })
  extraName!: string;

  @Enum({ items: () => ExtraCategoryType, fieldName: 'category_type' })
  categoryType: ExtraCategoryType = ExtraCategoryType.GENERAL;
}
