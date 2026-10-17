import { Entity, Property, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import type { Expense } from '../expense/expense.entity.js';

/** Proveedor / local de compra (ej. "Zona once", "Queen", "Temu"). */
@Entity({ tableName: 'suppliers' })
export class Supplier extends BaseEntity {
  @Property({ unique: true })
  name!: string;

  @OneToMany('Expense', 'supplier')
  expenses = new Collection<Expense>(this);
}
