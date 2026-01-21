import { Entity, Property, ManyToOne, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Product } from '../product/product.entity.js';

@Entity({ tableName: 'variants' })
export class Variant extends BaseEntity {
  @ManyToOne(() => Product, { fieldName: 'product_id', deleteRule: 'cascade' })
  product!: Rel<Product>;

  @Property()
  name!: string;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;
}
