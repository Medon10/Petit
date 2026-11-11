import { adminRequestJson, buildQuery } from './api';

// Cliente de API para el control de inventario de piezas.
// Se ubica fuera de api.ts para que el bundle de la tienda pública no lo importe.

export type LinkedVariantSummary = {
  variantId: number;
  variantName: string;
  productName?: string;
  quantity: number;
};

export type SupplyDto = {
  id: number;
  code: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isActive: boolean;
  linkedVariantsCount: number;
  linkedVariants: LinkedVariantSummary[];
};

export type StockMovementType = 'initial' | 'purchase' | 'sale' | 'sale_reversal' | 'adjustment';

export type StockMovementDto = {
  id: number;
  delta: number;
  type: StockMovementType;
  note: string | null;
  orderId: number | null;
  customerName: string | null;
  createdAt: string;
};

export type VariantComponentDto = {
  id?: number;
  variantId: number;
  variantName?: string;
  productName?: string;
  supplyId: number | null;
  supplyCode?: string;
  supplyName?: string;
  quantity: number;
};

export type SupplyInput = {
  code: string;
  name: string;
  stock?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
};

export type StockAdjustInput = {
  new_stock?: number;
  delta?: number;
  note?: string;
};

export async function fetchSupplies(params?: {
  q?: string;
  low_stock_only?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ data: SupplyDto[]; total: number; page: number; totalPages: number }> {
  const query = buildQuery({
    q: params?.q,
    low_stock_only: params?.low_stock_only ? 'true' : undefined,
    page: params?.page,
    limit: params?.limit,
  });
  return adminRequestJson(`/admin/supplies${query}`, { method: 'GET' });
}

export async function fetchSupply(id: number): Promise<{ data: SupplyDto }> {
  return adminRequestJson(`/admin/supplies/${id}`, { method: 'GET' });
}

export async function createSupply(payload: SupplyInput): Promise<{ message: string; data: SupplyDto }> {
  return adminRequestJson('/admin/supplies', {
    method: 'POST',
    body: payload,
  });
}

export async function updateSupply(
  id: number,
  payload: Partial<SupplyInput>
): Promise<{ message: string; data: SupplyDto }> {
  return adminRequestJson(`/admin/supplies/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteSupply(
  id: number
): Promise<{ message: string; data: { id: number; code: string; name: string } }> {
  return adminRequestJson(`/admin/supplies/${id}`, {
    method: 'DELETE',
  });
}

export async function adjustSupplyStock(
  id: number,
  payload: StockAdjustInput
): Promise<{ message: string; data: SupplyDto }> {
  return adminRequestJson(`/admin/supplies/${id}/adjust`, {
    method: 'POST',
    body: payload,
  });
}

export async function fetchSupplyMovements(
  id: number,
  params?: { page?: number; limit?: number }
): Promise<{ data: StockMovementDto[]; total: number; page: number; totalPages: number }> {
  const query = buildQuery(params ?? {});
  return adminRequestJson(`/admin/supplies/${id}/movements${query}`, { method: 'GET' });
}

export async function fetchVariantComponent(
  variantId: number
): Promise<{ data: VariantComponentDto | null }> {
  return adminRequestJson(`/admin/variants-components/${variantId}`, { method: 'GET' });
}

export async function setVariantComponent(
  variantId: number,
  supplyId: number | null,
  quantity: number = 1
): Promise<{ message: string; data: VariantComponentDto | null }> {
  return adminRequestJson(`/admin/variants-components/${variantId}`, {
    method: 'PUT',
    body: { supply_id: supplyId, quantity },
  });
}

export async function fetchAllVariantComponents(): Promise<{
  data: Array<{
    variantId: number;
    supplyId: number;
    supplyCode: string;
    supplyName: string;
    quantity: number;
  }>;
}> {
  return adminRequestJson('/admin/supplies/mappings', { method: 'GET' });
}
