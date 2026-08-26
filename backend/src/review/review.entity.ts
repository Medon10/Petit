import { Entity, Property, ManyToOne, Enum, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Product } from '../product/product.entity.js';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity({ tableName: 'reviews' })
export class Review extends BaseEntity {
  @ManyToOne(() => Product, { fieldName: 'product_id' })
  product!: Rel<Product>;

  @Property({ fieldName: 'customer_name' })
  customerName!: string;

  @Property({ type: 'smallint' })
  rating!: number;

  @Property({ type: 'text', nullable: true })
  comment?: string;

  @Enum({ items: () => ReviewStatus })
  status: ReviewStatus = ReviewStatus.PENDING;

  @Property({ fieldName: 'created_at', type: 'datetime', nullable: true, onCreate: () => new Date() })
  createdAt?: Date = new Date();
}
