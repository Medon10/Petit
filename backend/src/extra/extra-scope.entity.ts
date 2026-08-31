import { Entity, ManyToOne, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Extra } from './extra.entity.js';
import { Product } from '../product/product.entity.js';
import { Category } from '../category/category.entity.js';

/**
 * Tabla de asociación: determina en qué productos o categorías aplica un extra.
 * - Si un extra no tiene ningún scope → aplica a TODOS los productos (comportamiento global).
 * - Si tiene scopes → solo aparece en los productos/categorías listados.
 *
 * Cada fila representa UNA asignación: tiene `product_id` OR `category_id` (nunca ambos).
 */
@Entity({ tableName: 'extra_applicable_to' })
export class ExtraScope extends BaseEntity {
  @ManyToOne(() => Extra, { fieldName: 'extra_id' })
  extra!: Rel<Extra>;

  /** ID del producto al que aplica este extra (null si es por categoría). */
  @ManyToOne(() => Product, { fieldName: 'product_id', nullable: true })
  product?: Rel<Product> | null;

  /** ID de la categoría a la que aplica este extra (null si es por producto). */
  @ManyToOne(() => Category, { fieldName: 'category_id', nullable: true })
  category?: Rel<Category> | null;
}
