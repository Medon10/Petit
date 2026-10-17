import { adminRequestJson, buildQuery } from './api';

// Cliente del panel de finanzas. Vive aparte de api.ts para que solo lo
// descargue el chunk del admin (la tienda pública no lo importa).

export type ExpenseCategory = 'insumos' | 'packaging' | 'equipamiento' | 'inversion' | 'envios' | 'publicidad' | 'otros';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'insumos', label: 'Insumos' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'equipamiento', label: 'Equipamiento' },
  { value: 'inversion', label: 'Inversión' },
  { value: 'envios', label: 'Envíos' },
  { value: 'publicidad', label: 'Publicidad' },
  { value: 'otros', label: 'Otros' },
];

export const categoryLabel = (c: string) => EXPENSE_CATEGORIES.find((x) => x.value === c)?.label ?? c;

export type SupplierDto = { id: number; name: string };

export type ExpenseItemDto = {
  id: number;
  description: string;
  category: ExpenseCategory;
  quantity: number | null;
  unitCost: string | null;
  total: string;
};

export type ExpenseDto = {
  id: number;
  date: string;
  notes: string | null;
  supplier: SupplierDto | null;
  items: ExpenseItemDto[];
  total: string;
};

export type ExpenseItemInput = {
  description: string;
  category: ExpenseCategory;
  quantity?: number | null;
  unit_cost?: number | null;
  total: number;
};

export type ExpenseInput = {
  date: string;
  supplier_name?: string;
  supplier_id?: number | null;
  notes?: string;
  items: ExpenseItemInput[];
};

export type PeriodTotals = {
  ingresos: number;
  gastos: number;
  inversion: number;
  gananciaOperativa: number;
  gananciaNeta: number;
  pedidos: number;
  ticketPromedio: number;
};

export type SummaryDto = {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  current: PeriodTotals;
  previous: PeriodTotals;
};

export type MonthlyRow = {
  month: number;
  ingresos: number;
  gastos: number;
  inversion: number;
  gananciaNeta: number;
  pedidos: number;
};

export type MonthlyDto = {
  year: number;
  months: MonthlyRow[];
  totals: { ingresos: number; gastos: number; inversion: number; pedidos: number; gananciaNeta: number };
};

export type BreakdownDto = {
  byCategory: { category: string; total: number }[];
  bySupplier: { supplier: string; total: number }[];
};

export type TopDto = {
  items: { product: string; variant: string; unidades: number; ingresos: number }[];
  extras: { extra: string; unidades: number; ingresos: number }[];
};

export const adminGetExpenses = (p: { from?: string; to?: string; q?: string; page?: number; limit?: number }) =>
  adminRequestJson<{ data: ExpenseDto[]; total: number; page: number; totalPages: number }>(
    `/admin/expenses${buildQuery({ from: p.from, to: p.to, q: p.q || undefined, page: p.page, limit: p.limit })}`,
    { method: 'GET' }
  );

export const adminCreateExpense = (body: ExpenseInput) =>
  adminRequestJson<{ data: ExpenseDto }>('/admin/expenses', { method: 'POST', body });

export const adminUpdateExpense = (id: number, body: ExpenseInput) =>
  adminRequestJson<{ data: ExpenseDto }>(`/admin/expenses/${id}`, { method: 'PUT', body });

export const adminDeleteExpense = (id: number) =>
  adminRequestJson<{ message: string }>(`/admin/expenses/${id}`, { method: 'DELETE' });

export const adminGetSuppliers = () =>
  adminRequestJson<{ data: SupplierDto[] }>('/admin/suppliers', { method: 'GET' });

export const adminGetSummary = (from: string, to: string) =>
  adminRequestJson<SummaryDto>(`/admin/stats/summary${buildQuery({ from, to })}`, { method: 'GET' });

export const adminGetMonthly = (year: number) =>
  adminRequestJson<MonthlyDto>(`/admin/stats/monthly${buildQuery({ year })}`, { method: 'GET' });

export const adminGetBreakdown = (from: string, to: string) =>
  adminRequestJson<BreakdownDto>(`/admin/stats/expenses-breakdown${buildQuery({ from, to })}`, { method: 'GET' });

export const adminGetTop = (from: string, to: string) =>
  adminRequestJson<TopDto>(`/admin/stats/top${buildQuery({ from, to })}`, { method: 'GET' });

// ── Formato ─────────────────────────────────────────────────

const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
export const formatMoney = (n: number | string) => moneyFmt.format(Number(n) || 0);

export const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' sin pasar por Date (evita corrimientos de zona horaria). */
export const formatDateAR = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Primer y último día de un mes (month 1-12) como 'YYYY-MM-DD'. */
export function monthRange(year: number, month: number) {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${year}-${pad2(month)}-01`, to: `${year}-${pad2(month)}-${pad2(last)}` };
}
