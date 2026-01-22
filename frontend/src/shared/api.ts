export type CategoryDto = {
  id: number;
  name: string;
  representativeImageUrl?: string | null;
};

export type VariantDto = {
  id: number;
  name: string;
  price: string;
};

export type ExtraDto = {
  id: number;
  name: string;
  price: string;
  categoryType?: 'general' | 'dije' | 'cadena' | 'servicio' | string;
};

export type ProductDto = {
  id: number;
  name: string;
  imageUrl?: string | null;
  variants?: VariantDto[];
};

export type CategoryRefDto = {
  id: number;
  name: string;
};

export type ProductDetailDto = ProductDto & {
  description?: string | null;
  category?: CategoryRefDto | null;
};

export function apiBase() {
  return (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
}

export function toAbsoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = apiBase().replace(/\/$/, '');
  const path = String(pathOrUrl).startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function apiGetJson<T>(path: string): Promise<T> {
  const base = apiBase().replace(/\/$/, '');
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function apiRequestJson<T>(path: string, options: { method: string; body?: unknown }): Promise<T> {
  const base = apiBase().replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as any)?.message || `API ${res.status} ${res.statusText}`;
    throw new Error(String(msg));
  }
  return json as T;
}

export async function getCategories(options?: { includeRepresentative?: boolean }) {
  const qs = buildQuery({ include_representative: options?.includeRepresentative ? 1 : undefined });
  const data = await apiGetJson<{ data?: unknown }>(`/categories${qs}`);
  return Array.isArray((data as any)?.data) ? ((data as any).data as CategoryDto[]) : [];
}

export async function getProducts(options?: { limit?: number; categoryId?: number }) {
  const qs = buildQuery({
    limit: options?.limit,
    category_id: options?.categoryId,
  });
  const data = await apiGetJson<{ data?: unknown }>(`/products${qs}`);
  return Array.isArray((data as any)?.data) ? ((data as any).data as ProductDto[]) : [];
}

export async function getProduct(id: number) {
  const data = await apiGetJson<{ data?: unknown }>(`/products/${id}`);
  const item = (data as any)?.data;
  return item && typeof item === 'object' ? (item as ProductDetailDto) : null;
}

export async function getExtras(options?: { categoryType?: string }) {
  const qs = buildQuery({ category_type: options?.categoryType });
  const data = await apiGetJson<{ data?: unknown }>(`/extras${qs}`);
  return Array.isArray((data as any)?.data) ? ((data as any).data as ExtraDto[]) : [];
}

export type CreateOrderInput = {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  items: Array<{
    product_id: number;
    variant_id: number;
    quantity: number;
    extras?: Array<{ extra_id: number; quantity: number }>;
  }>;
};

export async function createOrder(input: CreateOrderInput) {
  return await apiRequestJson<{ data?: unknown }>(`/orders`, { method: 'POST', body: input });
}
