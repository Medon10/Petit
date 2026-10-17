import { Entity, Property, OneToOne, type Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/bdd/BaseEntity.js';
import { Variant } from '../variant/variant.entity.js';

/**
 * Estructura de costos unitarios de fabricación por variante.
 * Permite calcular márgenes reales y sugerir precios sin mezclar
 * costos privados con la entidad pública de la variante.
 */
@Entity({ tableName: 'variant_costs' })
export class VariantCost extends BaseEntity {
  @OneToOne(() => Variant, { fieldName: 'variant_id', unique: true, deleteRule: 'cascade' })
  variant!: Rel<Variant>;

  // 1. Costo del insumo/dije base (ej. $1.200)
  @Property({ fieldName: 'cost_piece', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPiece: string = '0';

  // 2. Costo del servicio de grabado (ej. $2.500)
  @Property({ fieldName: 'cost_engraving', type: 'decimal', precision: 10, scale: 2, default: 2500 })
  costEngraving: string = '2500';

  // 3. Cadena / Llavero / Argolla / Accesorio (ej. $600 o $800)
  @Property({ fieldName: 'cost_chain', type: 'decimal', precision: 10, scale: 2, default: 600 })
  costChain: string = '600';

  // 4. Mano de obra / Hs de trabajo (ej. $3.500)
  @Property({ fieldName: 'cost_labor', type: 'decimal', precision: 10, scale: 2, default: 3500 })
  costLabor: string = '3500';

  // 5. Packaging y costos indirectos de envío local (ej. $1.000 collares, $500 llaveros)
  @Property({ fieldName: 'cost_packaging', type: 'decimal', precision: 10, scale: 2, default: 1000 })
  costPackaging: string = '1000';

  // 6. Otros costos varios
  @Property({ fieldName: 'cost_other', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costOther: string = '0';

  // Nota interna (ej. "Cadena Clapton", "Dije doble")
  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ fieldName: 'updated_at', type: 'datetime', onUpdate: () => new Date(), nullable: true })
  updatedAt?: Date = new Date();
}
