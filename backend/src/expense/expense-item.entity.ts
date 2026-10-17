import { Entity, Property, ManyToOne, Enum, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Expense } from './expense.entity.js';

export enum ExpenseCategory {
  INSUMOS = 'insumos',
  PACKAGING = 'packaging',
  EQUIPAMIENTO = 'equipamiento',
  INVERSION = 'inversion',
  ENVIOS = 'envios',
  PUBLICIDAD = 'publicidad',
  OTROS = 'otros',
}

/**
 * Línea de una compra. `total` es obligatorio; `quantity` y `unitCost` son
 * opcionales porque el Excel tiene líneas con solo el total (ej. "Cadena extensible").
 * La categoría `inversion` se excluye del gasto operativo (ej. CARRITO).
 */
@Entity({ tableName: 'expense_items' })
export class ExpenseItem extends BaseEntity {
  @ManyToOne(() => Expense, { fieldName: 'expense_id', deleteRule: 'cascade' })
  expense!: Rel<Expense>;

  @Property()
  description!: string;

  @Enum({ items: () => ExpenseCategory, fieldName: 'category' })
  category: ExpenseCategory = ExpenseCategory.INSUMOS;

  @Property({ type: 'integer', nullable: true })
  quantity?: number | null;

  @Property({ fieldName: 'unit_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost?: string | null;

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  total!: string;
}
