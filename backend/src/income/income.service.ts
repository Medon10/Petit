import { orm } from '../shared/bdd/orm.js';
import { ExternalIncome } from './income.entity.js';

export type IncomeInput = {
  date?: unknown;
  description?: unknown;
  amount?: unknown;
  notes?: unknown;
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

function parseAmount(raw: unknown): number {
  if (raw === undefined || raw === null || String(raw).trim() === '') throw inputError('El monto es requerido');
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw inputError('El monto debe ser mayor a 0');
  return Math.round(n * 100) / 100;
}

function normalize(input: IncomeInput) {
  const date = parseDate(input.date);
  const description = String(input.description ?? '').trim();
  if (!description) throw inputError('La descripción es requerida');
  if (description.length > 255) throw inputError('La descripción es demasiado larga');
  const amount = parseAmount(input.amount);
  const notes = String(input.notes ?? '').trim() || null;
  return { date, description, amount, notes };
}

function toDto(i: any) {
  return {
    id: i.id,
    date: i.date,
    description: i.description,
    amount: i.amount,
    notes: i.notes ?? null,
  };
}

export async function listIncomes(params: { from?: unknown; to?: unknown; q?: unknown; limit?: unknown }) {
  const em = orm.em.fork();
  const and: any[] = [];

  if (params.from) and.push({ date: { $gte: parseDate(params.from) } });
  if (params.to) and.push({ date: { $lte: parseDate(params.to) } });

  const q = String(params.q ?? '').trim();
  if (q) {
    and.push({ $or: [{ description: { $ilike: `%${q}%` } }, { notes: { $ilike: `%${q}%` } }] });
  }

  const limitNum = Number(params.limit);
  const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.min(limitNum, 1000) : 500;

  const rows = await em.find(ExternalIncome as any, and.length ? { $and: and } : {}, {
    orderBy: { date: 'DESC', id: 'DESC' } as any,
    limit,
  } as any);

  return { data: rows.map(toDto) };
}

export async function createIncome(input: IncomeInput) {
  const { date, description, amount, notes } = normalize(input);
  const em = orm.em.fork();
  const created = em.create(ExternalIncome as any, { date, description, amount: amount.toFixed(2), notes }) as any;
  await em.flush();
  return toDto(created);
}

export async function updateIncome(id: number, input: IncomeInput) {
  const { date, description, amount, notes } = normalize(input);
  const em = orm.em.fork();
  const found = (await em.findOne(ExternalIncome as any, { id })) as any;
  if (!found) return null;
  found.date = date;
  found.description = description;
  found.amount = amount.toFixed(2);
  found.notes = notes;
  await em.flush();
  return toDto(found);
}

export async function deleteIncome(id: number) {
  const em = orm.em.fork();
  const found = await em.findOne(ExternalIncome as any, { id });
  if (!found) return false;
  await em.removeAndFlush(found);
  return true;
}
