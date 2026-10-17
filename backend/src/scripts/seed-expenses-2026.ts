import '../env.js';

/**
 * Seed de gastos 2026 (enero y febrero) transcriptos del Excel "Ingresos y gastos 2026".
 *
 * Seguridad:
 *  - Se niega a correr si NODE_ENV=production o si hay DATABASE_URL / DB_URL (base remota).
 *  - Es idempotente: si ya hay compras con la marca de importación, no inserta nada.
 *
 * Uso (base local): npm run db:seed:expenses
 * Los datos del Excel pueden tener errores: revisar y corregir desde el panel (/admin/gastos).
 */

const IMPORT_TAG = 'Importado del Excel 2026';

type Line = [description: string, category: string, quantity: number | null, total: number];
type Purchase = { date: string; supplier: string; lines: Line[] };

const I = 'insumos';
const P = 'packaging';

const PURCHASES: Purchase[] = [
  {
    date: '2026-01-06',
    supplier: 'Zona once',
    lines: [
      ['Medalla 20mm', I, 10, 6000],
      ['Medalla corazón 29mm', I, 9, 7300],
      ['Medalla corazón 20mm', I, 9, 6130],
      ['Medalla militar 22mm', I, 7, 5000],
      ['Medalla militar grande 28mm', I, 9, 9400],
      ['Medalla cuadrada', I, 8, 5600],
      ['Dije barra', I, 10, 10000],
      ['Dije hueso', I, 4, 2800],
      ['Pulsera 7x30mm', I, 10, 20000],
      ['Llavero redondo 30mm', I, 5, 6300],
    ],
  },
  { date: '2026-01-15', supplier: 'Queen', lines: [['Cajones plásticos', 'equipamiento', 2, 12000]] },
  {
    date: '2026-01-29',
    supplier: 'Temu',
    lines: [
      ['Pulseras ajustables', I, 2, 3500],
      ['Dijes circulares 6mm', I, 50, 5000],
      ['Dijes rectangulares', I, 25, 7000],
      ['Cadena extensible', I, null, 5000],
      ['Cajas de almacenamiento', P, 2, 5000],
    ],
  },
  { date: '2026-02-02', supplier: '', lines: [['Hojas 180gr', P, 20, 7000]] },
  { date: '2026-02-07', supplier: '', lines: [['Hilo rosa', 'otros', 10, 1500]] },
  {
    date: '2026-02-11',
    supplier: 'Zona once',
    lines: [
      ['Cadena espejito', I, 20, 8000],
      ['Cadena acero dorado', I, 10, 6200],
      ['Medalla 20mm', I, 15, 10600],
      ['Medalla 30mm', I, 40, 29000],
      ['Medalla 25mm', I, 11, 5000],
      ['Medalla dorada 20mm', I, 10, 12000],
      ['Pulsera acero tiffany', I, 5, 5000],
      ['Dije hueso 40x25', I, 4, 4400],
    ],
  },
  {
    date: '2026-02-26',
    supplier: 'Temu',
    lines: [
      ['Pulsera esclava', I, 17, 14000],
      ['Corazones', I, 9, 3000],
      ['Estante', 'equipamiento', 1, 6800],
      ['Pulsera circular 20mm', I, 10, 3500],
      ['Cadena corazón', I, null, 3000],
      ['Aritos', I, 12, 5000],
      ['Bolsa de terciopelo', P, 10, 8000],
      ['Cadena celeste', I, null, 4000],
      ['Cadena rosa', I, null, 3700],
    ],
  },
];

async function main() {
  const remote = Boolean(process.env.DATABASE_URL?.trim() || process.env.DB_URL?.trim());
  if (process.env.NODE_ENV === 'production' || remote) {
    throw new Error('Seed bloqueado: NODE_ENV=production o base remota (DATABASE_URL/DB_URL). Solo se permite en base local.');
  }

  const { orm } = await import('../shared/bdd/orm.js');
  const { Expense } = await import('../expense/expense.entity.js');
  const { createExpense } = await import('../expense/expense.service.js');

  try {
    const em = orm.em.fork();
    const already = await em.count(Expense as any, { notes: IMPORT_TAG } as any);
    if (already > 0) {
      console.log(`Ya existen ${already} compras importadas. No se inserta nada.`);
      return;
    }

    for (const p of PURCHASES) {
      await createExpense({
        date: p.date,
        supplier_name: p.supplier,
        notes: IMPORT_TAG,
        items: p.lines.map(([description, category, quantity, total]) => ({
          description,
          category,
          quantity,
          total,
          unit_cost: quantity ? Math.round((total / quantity) * 100) / 100 : undefined,
        })),
      });
    }

    const jan = PURCHASES.filter((p) => p.date.startsWith('2026-01')).flatMap((p) => p.lines).reduce((a, l) => a + l[3], 0);
    console.log(`Importadas ${PURCHASES.length} compras. Total enero: ${jan} (el Excel indica 116030).`);
  } finally {
    await orm.close(true);
  }
}

main().catch((error) => {
  console.error('Seed fallido:', error?.message || error);
  process.exitCode = 1;
});
