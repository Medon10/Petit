import { orm } from '../shared/bdd/orm.js';

const TZ = 'America/Argentina/Buenos_Aires';

/** Pedidos que cuentan como ingreso: comprobante recibido o completados. */
const INCOME_STATUSES_SQL = `('processing','completed')`;

/**
 * Fecha (día local argentino) en que el pedido ingresó.
 * `paid_at` es la fuente; los pedidos anteriores a la feature usan `created_at`.
 * Las columnas datetime de MikroORM en PostgreSQL son `timestamptz`.
 */
const ORDER_DAY_SQL = `((COALESCE(o.paid_at, o.created_at)) AT TIME ZONE '${TZ}')::date`;

function inputError(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 400;
  return err;
}

function todayAR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function parseDate(raw: unknown, field: string): string {
  const s = String(raw ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw inputError(`${field} inválida (formato YYYY-MM-DD)`);
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) throw inputError(`${field} inválida`);
  return s;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;
}

/** Rango por defecto: mes en curso. */
function resolveRange(fromRaw: unknown, toRaw: unknown) {
  const today = todayAR();
  const from = fromRaw ? parseDate(fromRaw, 'from') : `${today.slice(0, 8)}01`;
  const to = toRaw ? parseDate(toRaw, 'to') : today;
  if (from > to) throw inputError('from no puede ser mayor a to');
  if (daysBetween(from, to) > 366 * 3) throw inputError('El rango es demasiado grande');
  return { from, to };
}

async function exec(sql: string, params: unknown[]): Promise<any[]> {
  const em = orm.em.fork();
  return (await em.getConnection().execute(sql, params)) as any[];
}

const num = (v: unknown) => Math.round(Number(v ?? 0) * 100) / 100;

async function periodTotals(from: string, to: string) {
  const [inc] = await exec(
    `SELECT COALESCE(SUM(o.total), 0) AS ingresos, COUNT(*)::int AS pedidos
       FROM orders o
      WHERE o.status IN ${INCOME_STATUSES_SQL}
        AND ${ORDER_DAY_SQL} BETWEEN ? AND ?`,
    [from, to]
  );
  const [exp] = await exec(
    `SELECT COALESCE(SUM(CASE WHEN ei.category <> 'inversion' THEN ei.total ELSE 0 END), 0) AS gastos,
            COALESCE(SUM(CASE WHEN ei.category = 'inversion' THEN ei.total ELSE 0 END), 0) AS inversion
       FROM expense_items ei
       JOIN expenses e ON e.id = ei.expense_id
      WHERE e.date BETWEEN ? AND ?`,
    [from, to]
  );
  const ingresos = num(inc?.ingresos);
  const gastos = num(exp?.gastos);
  const inversion = num(exp?.inversion);
  const pedidos = Number(inc?.pedidos ?? 0);
  return {
    ingresos,
    gastos,
    inversion,
    gananciaOperativa: num(ingresos - gastos),
    gananciaNeta: num(ingresos - gastos - inversion),
    pedidos,
    ticketPromedio: pedidos > 0 ? num(ingresos / pedidos) : 0,
  };
}

export async function getSummary(params: { from?: unknown; to?: unknown }) {
  const { from, to } = resolveRange(params.from, params.to);
  const span = daysBetween(from, to);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(span - 1));
  const [current, previous] = await Promise.all([periodTotals(from, to), periodTotals(prevFrom, prevTo)]);
  return { range: { from, to }, previousRange: { from: prevFrom, to: prevTo }, current, previous };
}

export async function getMonthly(params: { year?: unknown }) {
  const yearNum = params.year ? Number(params.year) : Number(todayAR().slice(0, 4));
  if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) throw inputError('year inválido');
  const from = `${yearNum}-01-01`;
  const to = `${yearNum}-12-31`;

  const incomeRows = await exec(
    `SELECT EXTRACT(MONTH FROM ${ORDER_DAY_SQL})::int AS m,
            COALESCE(SUM(o.total), 0) AS ingresos, COUNT(*)::int AS pedidos
       FROM orders o
      WHERE o.status IN ${INCOME_STATUSES_SQL}
        AND ${ORDER_DAY_SQL} BETWEEN ? AND ?
      GROUP BY 1`,
    [from, to]
  );
  const expenseRows = await exec(
    `SELECT EXTRACT(MONTH FROM e.date)::int AS m,
            COALESCE(SUM(CASE WHEN ei.category <> 'inversion' THEN ei.total ELSE 0 END), 0) AS gastos,
            COALESCE(SUM(CASE WHEN ei.category = 'inversion' THEN ei.total ELSE 0 END), 0) AS inversion
       FROM expense_items ei
       JOIN expenses e ON e.id = ei.expense_id
      WHERE e.date BETWEEN ? AND ?
      GROUP BY 1`,
    [from, to]
  );

  const months = Array.from({ length: 12 }, (_, i) => {
    const inc = incomeRows.find((r) => Number(r.m) === i + 1);
    const exp = expenseRows.find((r) => Number(r.m) === i + 1);
    const ingresos = num(inc?.ingresos);
    const gastos = num(exp?.gastos);
    const inversion = num(exp?.inversion);
    return {
      month: i + 1,
      ingresos,
      gastos,
      inversion,
      gananciaNeta: num(ingresos - gastos - inversion),
      pedidos: Number(inc?.pedidos ?? 0),
    };
  });

  const totals = months.reduce(
    (acc, m) => ({
      ingresos: acc.ingresos + m.ingresos,
      gastos: acc.gastos + m.gastos,
      inversion: acc.inversion + m.inversion,
      pedidos: acc.pedidos + m.pedidos,
    }),
    { ingresos: 0, gastos: 0, inversion: 0, pedidos: 0 }
  );

  return {
    year: yearNum,
    months,
    totals: { ...totals, gananciaNeta: num(totals.ingresos - totals.gastos - totals.inversion) },
  };
}

export async function getExpensesBreakdown(params: { from?: unknown; to?: unknown }) {
  const { from, to } = resolveRange(params.from, params.to);
  const byCategory = await exec(
    `SELECT ei.category AS category, COALESCE(SUM(ei.total), 0) AS total
       FROM expense_items ei JOIN expenses e ON e.id = ei.expense_id
      WHERE e.date BETWEEN ? AND ?
      GROUP BY ei.category ORDER BY total DESC`,
    [from, to]
  );
  const bySupplier = await exec(
    `SELECT COALESCE(s.name, 'Sin proveedor') AS supplier, COALESCE(SUM(ei.total), 0) AS total
       FROM expense_items ei
       JOIN expenses e ON e.id = ei.expense_id
       LEFT JOIN suppliers s ON s.id = e.supplier_id
      WHERE e.date BETWEEN ? AND ?
      GROUP BY 1 ORDER BY total DESC`,
    [from, to]
  );
  return {
    range: { from, to },
    byCategory: byCategory.map((r) => ({ category: r.category, total: num(r.total) })),
    bySupplier: bySupplier.map((r) => ({ supplier: r.supplier, total: num(r.total) })),
  };
}

export async function getTop(params: { from?: unknown; to?: unknown }) {
  const { from, to } = resolveRange(params.from, params.to);
  const items = await exec(
    `SELECT oi.product_name AS product, COALESCE(oi.variant_name, '') AS variant,
            SUM(oi.quantity)::int AS unidades, COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS ingresos
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ${INCOME_STATUSES_SQL} AND ${ORDER_DAY_SQL} BETWEEN ? AND ?
      GROUP BY 1, 2 ORDER BY unidades DESC, ingresos DESC LIMIT 10`,
    [from, to]
  );
  const extras = await exec(
    `SELECT oie.extra_name AS extra, SUM(oie.quantity)::int AS unidades,
            COALESCE(SUM(oie.quantity * oie.unit_price), 0) AS ingresos
       FROM order_item_extras oie
       JOIN order_items oi ON oi.id = oie.order_item_id
       JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ${INCOME_STATUSES_SQL} AND ${ORDER_DAY_SQL} BETWEEN ? AND ?
      GROUP BY 1 ORDER BY unidades DESC, ingresos DESC LIMIT 10`,
    [from, to]
  );
  return {
    range: { from, to },
    items: items.map((r) => ({ product: r.product, variant: r.variant, unidades: Number(r.unidades), ingresos: num(r.ingresos) })),
    extras: extras.map((r) => ({ extra: r.extra, unidades: Number(r.unidades), ingresos: num(r.ingresos) })),
  };
}
