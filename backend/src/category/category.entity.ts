import { Entity, Property, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Product } from '../product/product.entity.js';

@Entity({ tableName: 'categories' })
export class Category extends BaseEntity {
  @Property()
  name!: string;

  @Property({ fieldName: 'is_active', default: true })
  isActive: boolean = true;

  @OneToMany(() => Product, (product) => product.category)
  products = new Collection<Product>(this);
}
