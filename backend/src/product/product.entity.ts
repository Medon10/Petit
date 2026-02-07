import { Entity, Property, ManyToOne, OneToMany, Collection, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Category } from '../category/category.entity.js';
import { Variant } from '../variant/variant.entity.js';

@Entity({ tableName: 'products' })
export class Product extends BaseEntity {
  @ManyToOne(() => Category, { fieldName: 'category_id' })
  category!: Rel<Category>;

  @Property()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'image_url', nullable: true })
  imageUrl?: string;

  @Property({ fieldName: 'is_featured', default: false })
  isFeatured: boolean = false;

  @Property({ fieldName: 'featured_rank', default: 0 })
  featuredRank: number = 0;

  @Property({ fieldName: 'is_active', default: true })
  isActive: boolean = true;

  @OneToMany(() => Variant, (variant) => variant.product)
  variants = new Collection<Variant>(this);
}
