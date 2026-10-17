import '../env.js';

/**
 * Seed inicial de costos de fabricación transcriptos de la hoja "Precios" del Excel.
 * Carga costos base unitarios (dije, grabado, cadena, mano de obra, packaging)
 * para todas las variantes existentes.
 */

async function main() {
  const remote = Boolean(process.env.DATABASE_URL?.trim() || process.env.DB_URL?.trim());
  if (process.env.NODE_ENV === 'production' || remote) {
    throw new Error('Seed bloqueado en producción o base remota.');
  }

  const { orm } = await import('../shared/bdd/orm.js');
  const { Variant } = await import('../variant/variant.entity.js');
  const { VariantCost } = await import('../pricing/variant-cost.entity.js');

  try {
    const em = orm.em.fork();
    const variants = (await em.find(Variant as any, {}, { populate: ['product', 'product.category'] as any })) as any[];

    let seededCount = 0;

    for (const v of variants) {
      const existing = await em.findOne(VariantCost as any, { variant: v.id });
      if (!existing) {
        const catName = (v.product?.category?.name || '').toLowerCase();
        const pName = (v.product?.name || '').toLowerCase();
        const vName = (v.name || '').toLowerCase();

        let costPiece = 1000;
        let costEngraving = 2500;
        let costChain = 600;
        let costLabor = 3500;
        let costPackaging = 1000;
        let costOther = 0;

        if (catName.includes('llavero')) {
          costChain = 800;
          costPackaging = 500;
          costPiece = 1200;
        } else if (catName.includes('mascota')) {
          costPiece = 900;
          costChain = 200; // Argolla
          costPackaging = 500;
        } else if (catName.includes('pulsera')) {
          costPiece = 1000;
          costChain = 800;
          costPackaging = 1000;
        }

        // Casos exactos del Excel
        if (vName.includes('15mm') || pName.includes('15mm')) costPiece = 600;
        else if (vName.includes('20mm') || pName.includes('20mm')) costPiece = 1200;
        else if (vName.includes('25mm') || pName.includes('25mm')) costPiece = 1300;
        else if (vName.includes('30mm') || pName.includes('30mm')) costPiece = 1400;
        else if (vName.includes('12mm') || pName.includes('12mm')) costPiece = 500;
        else if (vName.includes('14mm') || pName.includes('14mm')) {
          costPiece = 700;
          costOther = 200; // Mosquetón
        } else if (pName.includes('rectang') || pName.includes('militar')) {
          costPiece = 1100;
        }

        em.create(VariantCost as any, {
          variant: v,
          costPiece: String(costPiece),
          costEngraving: String(costEngraving),
          costChain: String(costChain),
          costLabor: String(costLabor),
          costPackaging: String(costPackaging),
          costOther: String(costOther),
        });
        seededCount++;
      }
    }

    await em.flush();
    console.log(`Seed de costos completado: ${seededCount} variantes configuradas con costos base.`);
  } finally {
    await orm.close(true);
  }
}

main().catch((err) => {
  console.error('Error en seed-costs:', err);
  process.exitCode = 1;
});
