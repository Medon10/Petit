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

const ADMIN_TOKEN_KEY = 'petit_admin_token';

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

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function adminRequestJson<T>(path: string, options: { method: string; body?: unknown }): Promise<T> {
  const base = apiBase().replace(/\/$/, '');
  const token = getAdminToken();
  const res = await fetch(`${base}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as any)?.message || (json as any)?.error || `API ${res.status} ${res.statusText}`;
    throw new Error(String(msg));
  }
  return json as T;
}

async function adminRequestForm<T>(path: string, form: FormData): Promise<T> {
  const base = apiBase().replace(/\/$/, '');
  const token = getAdminToken();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as any)?.message || (json as any)?.error || `API ${res.status} ${res.statusText}`;
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

export async function adminLogin(input: { username: string; password: string }) {
  return await apiRequestJson<{ token?: string }>(`/admin/auth/login`, { method: 'POST', body: input });
}

export async function adminUploadImage(file: File) {
  const form = new FormData();
  form.append('image', file);
  return await adminRequestForm<{ data?: { url?: string } }>(`/admin/catalog/uploads`, form);
}

export async function adminCreateProduct(input: {
  category_id: number;
  name: string;
  description?: string;
  image_url?: string;
  is_featured?: boolean;
  featured_rank?: number;
  is_active?: boolean;
}) {
  return await adminRequestJson<{ data?: unknown }>(`/products`, { method: 'POST', body: input });
}

export async function adminUpdateProduct(id: number, input: {
  category_id?: number;
  name?: string;
  description?: string;
  image_url?: string;
  is_featured?: boolean;
  featured_rank?: number;
  is_active?: boolean;
}) {
  return await adminRequestJson<{ data?: unknown }>(`/products/${id}`, { method: 'PATCH', body: input });
}

export async function adminGetCategories() {
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/categories?include_inactive=1`, { method: 'GET' });
  return Array.isArray((data as any)?.data) ? ((data as any).data as CategoryDto[]) : [];
}
