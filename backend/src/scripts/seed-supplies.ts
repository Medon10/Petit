import '../env.js';

/**
 * Seed inicial de las 38 piezas de inventario transcriptas de la lista del taller
 * y con las cantidades del Excel de control de inventario.
 *
 * Seguridad:
 *  - Se niega a correr si NODE_ENV=production o si hay base remota (DATABASE_URL / DB_URL).
 *  - Es idempotente: si ya existe una pieza por código, no la duplica.
 */

const SUPPLIES_DATA = [
  { code: 'A1', name: 'Círculo 30mm', stock: 40 },
  { code: 'A2', name: 'Círculo 25mm', stock: 25 },
  { code: 'A3', name: 'Círculo 20mm', stock: 31 },
  { code: 'A4', name: 'Círculo 15mm', stock: 31 },
  { code: 'A5', name: 'Círculo 12mm', stock: 44 },
  { code: 'D6', name: 'Círculo dorado 20mm', stock: 10 },
  { code: 'C7', name: 'Medalla corazón 14mm', stock: 38 },
  { code: 'C8', name: 'Corazón 20mm', stock: 9 },
  { code: 'C9', name: 'Corazón 30mm', stock: 14 },
  { code: 'P10', name: 'Placa militar', stock: 26 },
  { code: 'P11', name: 'Placa militar grande', stock: 10 },
  { code: 'P12', name: 'Placa cuadrada', stock: 4 },
  { code: 'P13', name: 'Placa rectangular', stock: 3 },
  { code: 'R14', name: 'Rectángulo horizontal', stock: 9 },
  { code: 'R15', name: 'Rectángulo doble', stock: 4 },
  { code: 'R16', name: 'Rectángulo triple', stock: 8 },
  { code: 'B17', name: 'Barra', stock: 9 },
  { code: 'P18', name: 'Pulsera cadena plana', stock: 8 },
  { code: 'P19', name: 'Pulsera circular 12mm', stock: 25 },
  { code: 'P20', name: 'Pulsera corazón', stock: 4 },
  { code: 'P21', name: 'Pulsera esclava', stock: 0 },
  { code: 'P22', name: 'Pulsera con cadena ovalada', stock: 0 },
  { code: 'C23', name: 'Rompecabezas para compartir', stock: 0 },
  { code: 'C24', name: 'Corazón para compartir', stock: 0 },
  { code: 'H25', name: 'Medalla hueso chica', stock: 0 },
  { code: 'H26', name: 'Medalla hueso grande', stock: 0 },
  { code: 'L27', name: 'Separador de libros', stock: 0 },
  { code: 'L28', name: 'Llaveros', stock: 0 },
  { code: 'R29', name: 'Rectángulo', stock: 0 },
  { code: 'P30', name: 'Pulsera circular 20mm', stock: 0 },
  { code: 'BD1', name: 'Barra destapador botella', stock: 0 },
  { code: 'CC1', name: 'Círculos calados básicos', stock: 0 },
  { code: 'CT1', name: 'Corazón triple', stock: 0 },
  { code: 'CP1', name: 'Corazón pasante', stock: 0 },
  { code: 'HP1', name: 'Hueso con patita 30x16', stock: 0 },
  { code: 'CC2', name: 'Círculos calados sueltos', stock: 0 },
  { code: 'B100', name: 'Barra rectangular te amo en 100', stock: 0 },
  { code: 'PCG1', name: 'Placa cuadrada grande', stock: 0 },
];

async function main() {
  const remote = Boolean(process.env.DATABASE_URL?.trim() || process.env.DB_URL?.trim());
  if (process.env.NODE_ENV === 'production' || remote) {
    throw new Error('Seed bloqueado en producción o base remota.');
  }

  const { orm } = await import('../shared/bdd/orm.js');
  const { Supply } = await import('../supply/supply.entity.js');
  const { StockMovement, StockMovementType } = await import('../supply/stock-movement.entity.js');

  try {
    const em = orm.em.fork();
    let createdCount = 0;

    for (const item of SUPPLIES_DATA) {
      const existing = await em.findOne(Supply as any, { code: item.code });
      if (!existing) {
        const s = em.create(Supply as any, {
          code: item.code,
          name: item.name,
          stock: item.stock,
          lowStockThreshold: 5,
          isActive: true,
        }) as any;

        if (item.stock > 0) {
          em.create(StockMovement as any, {
            supply: s,
            delta: item.stock,
            type: StockMovementType.INITIAL,
            note: 'Stock inicial importado del Excel de control de inventario',
          });
        }
        createdCount++;
      }
    }

    await em.flush();
    console.log(`Seed completado: ${createdCount} piezas creadas de 38 piezas del catálogo.`);
  } finally {
    await orm.close(true);
  }
}

main().catch((err) => {
  console.error('Error en seed-supplies:', err);
  process.exitCode = 1;
});
