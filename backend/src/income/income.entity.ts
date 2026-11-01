import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';

/**
 * Ingreso registrado a mano por el administrador (ventas fuera de la tienda web:
 * en persona, ferias, etc.). Se suma a los ingresos de los pedidos en Estadísticas.
 */
@Entity({ tableName: 'external_incomes' })
export class ExternalIncome extends BaseEntity {
  /** Fecha del ingreso (DATE, formato YYYY-MM-DD, sin zona horaria). */
  @Property({ type: 'date' })
  date!: string;

  @Property({ type: 'string' })
  description!: string;

  @Property({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Property({ type: 'text', nullable: true })
  notes?: string | null;

  @Property({ fieldName: 'created_at', type: 'datetime', nullable: true, onCreate: () => new Date() })
  createdAt?: Date = new Date();
}
