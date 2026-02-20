export type CategoryDto = {
  id: number;
  name: string;
  isActive?: boolean;
  representativeImageUrl?: string | null;
};

export type VariantDto = {
  id: number;
  name: string;
  price: string;
  isActive?: boolean;
  product?: { id: number; name: string } | null;
};

export type ExtraDto = {
  id: number;
  name: string;
  price: string;
  isActive?: boolean;
  categoryType?: 'general' | 'dije' | 'cadena' | 'servicio' | string;
};

export type ProductDto = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
  featuredRank?: number;
  isActive?: boolean;
  category?: { id: number; name: string } | null;
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

// ── Admin Products ──────────────────────────────────────────

export async function adminGetProducts(opts?: { categoryId?: number }) {
  const qs = buildQuery({ category_id: opts?.categoryId, include_inactive: 1 });
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/products${qs}`, { method: 'GET' });
  return Array.isArray((data as any)?.data) ? ((data as any).data as ProductDto[]) : [];
}

export async function adminGetProduct(id: number) {
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/products/${id}`, { method: 'GET' });
  return (data as any)?.data as ProductDto | null;
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
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/products`, { method: 'POST', body: input });
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
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/products/${id}`, { method: 'PATCH', body: input });
}

export async function adminDeleteProduct(id: number) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/products/${id}`, { method: 'DELETE' });
}

export async function adminSetProductActive(id: number, isActive: boolean) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/products/${id}/active`, { method: 'PATCH', body: { is_active: isActive } });
}

// ── Admin Categories ────────────────────────────────────────

export async function adminGetCategories() {
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/categories?include_inactive=1`, { method: 'GET' });
  return Array.isArray((data as any)?.data) ? ((data as any).data as CategoryDto[]) : [];
}

export async function adminCreateCategory(input: { name: string; is_active?: boolean }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/categories`, { method: 'POST', body: input });
}

export async function adminUpdateCategory(id: number, input: { name?: string; is_active?: boolean }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/categories/${id}`, { method: 'PATCH', body: input });
}

export async function adminDeleteCategory(id: number) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/categories/${id}`, { method: 'DELETE' });
}

export async function adminSetCategoryActive(id: number, isActive: boolean) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/categories/${id}/active`, { method: 'PATCH', body: { is_active: isActive } });
}

// ── Admin Variants ──────────────────────────────────────────

export async function adminGetVariants(opts?: { productId?: number }) {
  const qs = buildQuery({ product_id: opts?.productId, include_inactive: 1 });
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/variants${qs}`, { method: 'GET' });
  return Array.isArray((data as any)?.data) ? ((data as any).data as VariantDto[]) : [];
}

export async function adminCreateVariant(input: { product_id: number; name: string; price: string; is_active?: boolean }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/variants`, { method: 'POST', body: input });
}

export async function adminUpdateVariant(id: number, input: { product_id?: number; name?: string; price?: string; is_active?: boolean }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/variants/${id}`, { method: 'PATCH', body: input });
}

export async function adminDeleteVariant(id: number) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/variants/${id}`, { method: 'DELETE' });
}

export async function adminSetVariantActive(id: number, isActive: boolean) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/variants/${id}/active`, { method: 'PATCH', body: { is_active: isActive } });
}

// ── Admin Extras ────────────────────────────────────────────

export async function adminGetExtras() {
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/extras?include_inactive=1`, { method: 'GET' });
  return Array.isArray((data as any)?.data) ? ((data as any).data as ExtraDto[]) : [];
}

export async function adminCreateExtra(input: { name: string; price: string; category_type?: string; is_active?: boolean }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/extras`, { method: 'POST', body: input });
}

export async function adminUpdateExtra(id: number, input: { name?: string; price?: string; category_type?: string; is_active?: boolean }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/extras/${id}`, { method: 'PATCH', body: input });
}

export async function adminDeleteExtra(id: number) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/extras/${id}`, { method: 'DELETE' });
}

export async function adminSetExtraActive(id: number, isActive: boolean) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/extras/${id}/active`, { method: 'PATCH', body: { is_active: isActive } });
}

// ── Admin Orders ────────────────────────────────────────────

export type OrderDto = {
  id: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  status: string;
  total: string;
  createdAt?: string;
  items?: Array<{
    id: number;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: string;
    extras?: Array<{
      id: number;
      extraName: string;
      quantity: number;
      unitPrice: string;
      categoryType?: string;
    }>;
  }>;
};

export async function adminGetOrders() {
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/orders`, { method: 'GET' });
  return Array.isArray((data as any)?.data) ? ((data as any).data as OrderDto[]) : [];
}

export async function adminGetOrder(id: number) {
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/orders/${id}`, { method: 'GET' });
  return (data as any)?.data as OrderDto | null;
}

export async function adminUpdateOrderStatus(id: number, status: string) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/orders/${id}/status`, { method: 'PATCH', body: { status } });
}
