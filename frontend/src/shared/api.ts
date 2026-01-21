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

export type ProductDto = {
  id: number;
  name: string;
  imageUrl?: string | null;
  variants?: VariantDto[];
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
