import { orm } from '../shared/bdd/orm.js';
import { Expense } from './expense.entity.js';
import { ExpenseItem, ExpenseCategory } from './expense-item.entity.js';
import { Supplier } from '../supplier/supplier.entity.js';

export type ExpenseItemInput = {
  description?: unknown;
  category?: unknown;
  quantity?: unknown;
  unit_cost?: unknown;
  unitCost?: unknown;
  total?: unknown;
};

export type ExpenseInput = {
  date?: unknown;
  supplier_id?: unknown;
  supplier_name?: unknown;
  notes?: unknown;
  items?: ExpenseItemInput[];
};

function inputError(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 400;
  return err;
}

function parseDate(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw inputError('date inválida (formato YYYY-MM-DD)');
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) throw inputError('date inválida');
  return s;
}

function parseMoney(raw: unknown, field: string): number | null {
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw inputError(`${field} inválido`);
  return Math.round(n * 100) / 100;
}

function parseQuantity(raw: unknown): number | null {
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw inputError('quantity inválida (entero > 0)');
  return n;
}

const VALID_CATEGORIES = Object.values(ExpenseCategory) as string[];

function normalizeItems(items: ExpenseItemInput[] | undefined) {
  if (!Array.isArray(items) || items.length === 0) throw inputError('Debe haber al menos una línea');
  return items.map((it, idx) => {
    const line = idx + 1;
    const description = String(it.description ?? '').trim();
    if (!description) throw inputError(`Línea ${line}: la descripción es requerida`);

    const category = String(it.category ?? ExpenseCategory.INSUMOS).trim() || ExpenseCategory.INSUMOS;
    if (!VALID_CATEGORIES.includes(category)) throw inputError(`Línea ${line}: categoría inválida`);

    const quantity = parseQuantity(it.quantity);
    const unitCost = parseMoney(it.unit_cost ?? it.unitCost, 'unit_cost');
    let total = parseMoney(it.total, 'total');
    // Si no viene el total pero sí cantidad y costo unitario, se calcula.
    if (total === null && quantity !== null && unitCost !== null) {
      total = Math.round(quantity * unitCost * 100) / 100;
    }
    if (total === null) throw inputError(`Línea ${line}: el total es requerido`);

    return { description, category: category as ExpenseCategory, quantity, unitCost, total };
  });
}

async function resolveSupplier(em: any, input: ExpenseInput): Promise<Supplier | null> {
  const id = Number(input.supplier_id);
  if (input.supplier_id !== undefined && input.supplier_id !== null && input.supplier_id !== '' && Number.isInteger(id)) {
    const found = await em.findOne(Supplier, { id });
    if (!found) throw inputError('supplier_id inválido');
    return found;
  }
  const name = String(input.supplier_name ?? '').trim();
  if (!name) return null;
  const existing = await em.findOne(Supplier, { name: { $ilike: name } });
  if (existing) return existing;
  const created = em.create(Supplier, { name });
  return created;
}

function toDto(e: any) {
  const items = (e.items?.getItems?.() ?? []).map((i: any) => ({
    id: i.id,
    description: i.description,
    category: i.category,
    quantity: i.quantity ?? null,
    unitCost: i.unitCost ?? null,
    total: i.total,
  }));
  const total = items.reduce((acc: number, i: any) => acc + Number(i.total), 0);
  return {
    id: e.id,
    date: e.date,
    notes: e.notes ?? null,
    supplier: e.supplier ? { id: e.supplier.id, name: e.supplier.name } : null,
    items,
    total: total.toFixed(2),
  };
}

export async function listExpenses(params: { from?: unknown; to?: unknown; q?: unknown; page?: unknown; limit?: unknown }) {
  const em = orm.em.fork();
  const where: any = {};
  const and: any[] = [];

  if (params.from) and.push({ date: { $gte: parseDate(params.from) } });
  if (params.to) and.push({ date: { $lte: parseDate(params.to) } });

  const q = String(params.q ?? '').trim();
  if (q) {
    and.push({
      $or: [
        { notes: { $ilike: `%${q}%` } },
        { supplier: { name: { $ilike: `%${q}%` } } },
        { items: { description: { $ilike: `%${q}%` } } },
      ],
    });
  }
  if (and.length) where.$and = and;

  const limitNum = Number(params.limit);
  const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 500) : 100;
  const pageNum = Number(params.page);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;

  const [rows, total] = await em.findAndCount(Expense as any, where, {
    populate: ['items', 'supplier'] as any,
    orderBy: { date: 'DESC', id: 'DESC' } as any,
    limit,
    offset: (page - 1) * limit,
  } as any);

  return {
    data: rows.map(toDto),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getExpense(id: number) {
  const em = orm.em.fork();
  const e = await em.findOne(Expense as any, { id }, { populate: ['items', 'supplier'] as any } as any);
  return e ? toDto(e) : null;
}

export async function createExpense(input: ExpenseInput) {
  const date = parseDate(input.date);
  const items = normalizeItems(input.items);
  const notes = String(input.notes ?? '').trim() || undefined;

  const em = orm.em.fork();
  const id = await em.transactional(async (tem) => {
    const supplier = await resolveSupplier(tem, input);
    const expense = tem.create(Expense as any, { date, supplier, notes }) as any;
    for (const it of items) {
      tem.create(ExpenseItem as any, {
        expense,
        description: it.description,
        category: it.category,
        quantity: it.quantity,
        unitCost: it.unitCost !== null ? it.unitCost.toFixed(2) : null,
        total: it.total.toFixed(2),
      });
    }
    await tem.flush();
    return expense.id as number;
  });
  return await getExpense(id);
}

export async function updateExpense(id: number, input: ExpenseInput) {
  const date = parseDate(input.date);
  const items = normalizeItems(input.items);
  const notes = String(input.notes ?? '').trim() || null;

  const em = orm.em.fork();
  const found = await em.transactional(async (tem) => {
    const expense = (await tem.findOne(Expense as any, { id })) as any;
    if (!expense) return false;
    const supplier = await resolveSupplier(tem, input);
    expense.date = date;
    expense.supplier = supplier;
    expense.notes = notes;
    // Se reemplazan las líneas completas.
    await tem.nativeDelete(ExpenseItem as any, { expense: id } as any);
    for (const it of items) {
      tem.create(ExpenseItem as any, {
        expense,
        description: it.description,
        category: it.category,
        quantity: it.quantity,
        unitCost: it.unitCost !== null ? it.unitCost.toFixed(2) : null,
        total: it.total.toFixed(2),
      });
    }
    await tem.flush();
    return true;
  });
  if (!found) return null;
  return await getExpense(id);
}

export async function deleteExpense(id: number) {
  const em = orm.em.fork();
  const expense = await em.findOne(Expense as any, { id });
  if (!expense) return false;
  await em.removeAndFlush(expense);
  return true;
}

// ── Proveedores ─────────────────────────────────────────────

export async function listSuppliers() {
  const em = orm.em.fork();
  const rows = await em.find(Supplier as any, {}, { orderBy: { name: 'ASC' } as any } as any);
  return rows.map((s: any) => ({ id: s.id, name: s.name }));
}

export async function createSupplier(nameRaw: unknown) {
  const name = String(nameRaw ?? '').trim();
  if (!name) throw inputError('name es requerido');
  const em = orm.em.fork();
  const existing = await em.findOne(Supplier as any, { name: { $ilike: name } } as any);
  if (existing) return { id: (existing as any).id, name: (existing as any).name };
  const created = em.create(Supplier as any, { name }) as any;
  await em.flush();
  return { id: created.id, name: created.name };
}
