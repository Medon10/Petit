import { Entity, Property, ManyToOne, OneToMany, Collection, Cascade, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Supplier } from '../supplier/supplier.entity.js';
import type { ExpenseItem } from './expense-item.entity.js';

/**
 * Cabecera de una compra (equivale a un bloque fecha + local del Excel).
 * El monto vive en las líneas (`ExpenseItem`).
 */
@Entity({ tableName: 'expenses' })
export class Expense extends BaseEntity {
  /** Fecha de la compra (DATE, formato YYYY-MM-DD, sin zona horaria). */
  @Property({ type: 'date' })
  date!: string;

  @ManyToOne(() => Supplier, { fieldName: 'supplier_id', nullable: true, deleteRule: 'set null' })
  supplier?: Rel<Supplier> | null;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ fieldName: 'created_at', type: 'datetime', nullable: true, onCreate: () => new Date() })
  createdAt?: Date = new Date();

  @OneToMany('ExpenseItem', 'expense', { cascade: [Cascade.ALL], orphanRemoval: true })
  items = new Collection<ExpenseItem>(this);
}
