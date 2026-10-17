import { adminRequestJson, buildQuery } from './api';

// Cliente de API para Costos, Precios y Márgenes de Ganancia.
// Se ubica fuera de api.ts para que el bundle de la tienda pública no lo importe.

export type VariantCostBreakdown = {
  costPiece: number;
  costEngraving: number;
  costChain: number;
  costLabor: number;
  costPackaging: number;
  costOther: number;
  totalCost: number;
};

export type VariantMarginMetrics = {
  suggested15: number;
  suggested20: number;
  profit: number;
  marginPercent: number;
  markupPercent: number;
  status: 'healthy' | 'warning' | 'critical';
};

export type VariantCostItem = {
  variantId: number;
  variantName: string;
  productId: number;
  productName: string;
  categoryId: number;
  categoryName: string;
  imageUrl: string | null;
  isActive: boolean;
  priceWeb: number;
  linkedSupply: {
    id: number;
    code: string;
    name: string;
  } | null;
  costs: VariantCostBreakdown;
  metrics: VariantMarginMetrics;
  notes: string | null;
};

export type PricingSummary = {
  totalVariants: number;
  averageMargin: number;
  averageProfit: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
};

export type PricingResponse = {
  summary: PricingSummary;
  data: VariantCostItem[];
};

export type VariantCostUpdateInput = {
  price_web?: number;
  cost_piece?: number;
  cost_engraving?: number;
  cost_chain?: number;
  cost_labor?: number;
  cost_packaging?: number;
  cost_other?: number;
  notes?: string;
};

export type BatchCostUpdateInput = {
  field: 'cost_engraving' | 'cost_chain' | 'cost_labor' | 'cost_packaging';
  value: number;
  category_id?: number;
};

export async function fetchPricing(params?: {
  category_id?: number;
  q?: string;
}): Promise<PricingResponse> {
  const query = buildQuery({
    category_id: params?.category_id,
    q: params?.q,
  });
  return adminRequestJson(`/admin/pricing${query}`, { method: 'GET' });
}

export async function updateVariantPricing(
  variantId: number,
  payload: VariantCostUpdateInput
): Promise<{ message: string; data: VariantCostItem | null }> {
  return adminRequestJson(`/admin/pricing/${variantId}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function batchUpdateCosts(
  payload: BatchCostUpdateInput
): Promise<{ updatedCount: number; message: string }> {
  return adminRequestJson('/admin/pricing/batch', {
    method: 'POST',
    body: payload,
  });
}
