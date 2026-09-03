export type CategoryDto = {
  id: number;
  name: string;
  isActive?: boolean;
  imageUrl?: string | null;
  representativeImageUrl?: string | null;
};

export type VariantDto = {
  id: number;
  name: string;
  price: string;
  imageUrl?: string | null;
  isActive?: boolean;
  product?: { id: number; name: string } | null;
};

export type ExtraDto = {
  id: number;
  name: string;
  price: string;
  isActive?: boolean;
  categoryType?: 'general' | 'dije' | 'cadena' | 'servicio' | string;
  /** Scopes de este extra: si está vacío aplica a todos los productos */
  scopes?: { productIds: number[]; categoryIds: number[] };
};

export type ProductDto = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  galleryImages?: string[] | null;
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

export type HomeSettingsDto = {
  heroImageUrl?: string | null;
  heroImageLeftUrl?: string | null;
  heroImageRightUrl?: string | null;
};

export type ProductsPageDto = {
  data: ProductDto[];
  total: number;
  page: number;
  totalPages: number;
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

export function toResponsiveImage(pathOrUrl?: string | null) {
  const src = toAbsoluteUrl(pathOrUrl);
  if (!src) return { src: undefined as string | undefined, srcSet: undefined as string | undefined };

  const raw = String(pathOrUrl ?? '');
  const smRaw = raw.replace(/-xl\.webp(?=$|[?#])/i, '-sm.webp');
  if (smRaw === raw) {
    // Legacy files (png/jpg/jpeg or old webp names) still work without srcSet.
    return { src, srcSet: undefined as string | undefined };
  }

  const sm = toAbsoluteUrl(smRaw);
  if (!sm) return { src, srcSet: undefined as string | undefined };

  return {
    src,
    srcSet: `${sm} 600w, ${src} 1800w`,
  };
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
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const msg = (json as any)?.message || `API ${res.status} ${res.statusText}`;
    const err = new Error(String(msg)) as Error & { code?: string };
    if (typeof (json as any)?.code === 'string') err.code = (json as any).code;
    throw err;
  }
  return (await res.json()) as T;
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
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const msg = (json as any)?.message || (json as any)?.error || `API ${res.status} ${res.statusText}`;
    const err = new Error(String(msg)) as Error & { code?: string };
    if (typeof (json as any)?.code === 'string') err.code = (json as any).code;
    throw err;
  }
  return (await res.json()) as T;
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
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const msg = (json as any)?.message || (json as any)?.error || `API ${res.status} ${res.statusText}`;
    throw new Error(String(msg));
  }
  return (await res.json()) as T;
}

export async function getCategories(options?: { includeRepresentative?: boolean }) {
  const qs = buildQuery({ include_representative: options?.includeRepresentative ? 1 : undefined });
  const data = await apiGetJson<{ data?: unknown }>(`/categories${qs}`);
  return Array.isArray((data as any)?.data) ? ((data as any).data as CategoryDto[]) : [];
}

export async function getProducts(options?: { limit?: number; categoryId?: number; featured?: boolean }) {
  const result = await getProductsPage({
    limit: options?.limit,
    categoryId: options?.categoryId,
    featured: options?.featured,
    page: 1,
  });
  return result.data;
}

export async function getProductsPage(options?: { limit?: number; categoryId?: number; featured?: boolean; page?: number }) {
  const qs = buildQuery({
    limit: options?.limit,
    category_id: options?.categoryId,
    featured: options?.featured,
    page: options?.page,
  });
  const data = await apiGetJson<Partial<ProductsPageDto> & { data?: unknown }>(`/products${qs}`);
  const rows = Array.isArray((data as any)?.data) ? ((data as any).data as ProductDto[]) : [];
  const total = Number((data as any)?.total ?? rows.length);
  const page = Number((data as any)?.page ?? (options?.page ?? 1));
  const totalPages = Number((data as any)?.totalPages ?? 1);
  return { data: rows, total, page, totalPages } as ProductsPageDto;
}

export async function getProduct(id: number) {
  const data = await apiGetJson<{ data?: unknown }>(`/products/${id}`);
  const item = (data as any)?.data;
  return item && typeof item === 'object' ? (item as ProductDetailDto) : null;
}

export async function searchProductsPage(term: string, options?: { page?: number; limit?: number }) {
  const q = String(term || '').trim();
  if (!q) return { data: [], total: 0, page: 1, totalPages: 1 } as ProductsPageDto;
  const data = await apiGetJson<Partial<ProductsPageDto> & { data?: unknown }>(
    `/products/search${buildQuery({ q, page: options?.page, limit: options?.limit })}`
  );
  const rows = Array.isArray((data as any)?.data) ? ((data as any).data as ProductDto[]) : [];
  const total = Number((data as any)?.total ?? rows.length);
  const page = Number((data as any)?.page ?? (options?.page ?? 1));
  const totalPages = Number((data as any)?.totalPages ?? 1);
  return { data: rows, total, page, totalPages } as ProductsPageDto;
}

export async function searchProducts(term: string) {
  const result = await searchProductsPage(term, { page: 1, limit: 20 });
  return result.data;
}

export async function getExtras(options?: { categoryType?: string; productId?: number; categoryId?: number }) {
  const qs = buildQuery({
    category_type: options?.categoryType,
    product_id: options?.productId,
    category_id: options?.categoryId,
  });
  const data = await apiGetJson<{ data?: unknown }>(`/extras${qs}`);
  return Array.isArray((data as any)?.data) ? ((data as any).data as ExtraDto[]) : [];
}

export async function getHomeSettings() {
  const data = await apiGetJson<{ data?: unknown }>(`/site-settings/home`);
  const item = (data as any)?.data;
  return item && typeof item === 'object' ? (item as HomeSettingsDto) : { heroImageUrl: null };
}

export type ShippingMethod = 'pickup' | 'delivery';

export type ShippingQuoteExtraInput = {
  extra_id: number;
  quantity?: number;
};

export type ShippingQuoteItemInput = {
  product_id: number;
  variant_id: number;
  quantity: number;
  extras?: ShippingQuoteExtraInput[];
};

export type CreateOrderInput = {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  shipping?: {
    method?: ShippingMethod;
    postal_code?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    province?: string;
  };
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

export async function adminGetHomeSettings() {
  const data = await adminRequestJson<{ data?: unknown }>(`/site-settings/home`, { method: 'GET' });
  const item = (data as any)?.data;
  return item && typeof item === 'object' ? (item as HomeSettingsDto) : { heroImageUrl: null };
}

export async function adminUpdateHomeSettings(input: { hero_image_url?: string; hero_image_left_url?: string; hero_image_right_url?: string }) {
  return await adminRequestJson<{ data?: unknown }>(`/site-settings/home`, { method: 'PATCH', body: input });
}

// ── Admin Products ──────────────────────────────────────────

export async function adminGetProducts(opts?: { categoryId?: number }) {
  const qs = buildQuery({ category_id: opts?.categoryId, include_inactive: 1, limit: 200 });
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/products${qs}`, { method: 'GET' });
  return Array.isArray((data as any)?.data) ? ((data as any).data as ProductDto[]) : [];
}


export async function adminCreateProduct(input: {
  category_id: number;
  name: string;
  description?: string;
  image_url?: string;
  gallery_images?: string[];
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
  gallery_images?: string[];
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

export async function adminCreateCategory(input: { name: string; image_url?: string; is_active?: boolean }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/categories`, { method: 'POST', body: input });
}

export async function adminUpdateCategory(id: number, input: { name?: string; image_url?: string; is_active?: boolean }) {
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

export async function adminCreateVariant(input: { product_id: number; name: string; price: string; image_url?: string; is_active?: boolean }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/variants`, { method: 'POST', body: input });
}

export async function adminUpdateVariant(id: number, input: { product_id?: number; name?: string; price?: string; image_url?: string; is_active?: boolean }) {
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

export async function adminGetExtraScopes(id: number): Promise<{ productIds: number[]; categoryIds: number[] }> {
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/extras/${id}/scopes`, { method: 'GET' });
  const d = (data as any)?.data ?? data as any;
  return { productIds: Array.isArray(d?.productIds) ? d.productIds : [], categoryIds: Array.isArray(d?.categoryIds) ? d.categoryIds : [] };
}

export async function adminSetExtraScopes(id: number, input: { product_ids: number[]; category_ids: number[] }) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/extras/${id}/scopes`, { method: 'PUT', body: input });
}

// ── Admin Orders ────────────────────────────────────────────

export type OrderDto = {
  id: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  shippingMethod?: ShippingMethod;
  shippingPostalCode?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingCost?: string;
  subtotal?: string;
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

export type OrdersPageDto = {
  data: OrderDto[];
  total: number;
  page: number;
  totalPages: number;
};

export async function adminGetOrders(options?: { status?: string; q?: string; page?: number; limit?: number }) {
  const qs = buildQuery({
    status: options?.status,
    q: options?.q,
    page: options?.page,
    limit: options?.limit,
  });
  const data = await adminRequestJson<any>(`/admin/catalog/orders${qs}`, { method: 'GET' });
  const rows = Array.isArray((data as any)?.data) ? ((data as any).data as OrderDto[]) : [];
  const total = Number((data as any)?.total ?? rows.length);
  const page = Number((data as any)?.page ?? (options?.page ?? 1));
  const totalPages = Number((data as any)?.totalPages ?? 1);
  return { data: rows, total, page, totalPages } as OrdersPageDto;
}

export async function adminGetOrder(id: number) {
  const data = await adminRequestJson<{ data?: unknown }>(`/admin/catalog/orders/${id}`, { method: 'GET' });
  return (data as any)?.data as OrderDto | null;
}

export async function adminUpdateOrderStatus(id: number, status: string) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/orders/${id}/status`, { method: 'PATCH', body: { status } });
}

// ── Reviews ─────────────────────────────────────────────────

export type ReviewDto = {
  id: number;
  productId: number;
  productName?: string;
  customerName: string;
  rating: number;
  comment?: string;
  status: string;
  createdAt?: string;
};

export type ReviewSummaryDto = {
  averageRating: number;
  totalReviews: number;
};

export type ReviewsPageDto = {
  data: ReviewDto[];
  total: number;
  page: number;
  totalPages: number;
};

// ── Public Reviews ──────────────────────────────────────────

export async function getProductReviews(productId: number, options?: { page?: number; limit?: number }) {
  const qs = buildQuery({ page: options?.page, limit: options?.limit });
  const data = await apiGetJson<any>(`/reviews/product/${productId}${qs}`);
  const rows = Array.isArray((data as any)?.data) ? ((data as any).data as ReviewDto[]) : [];
  const total = Number((data as any)?.total ?? rows.length);
  const page = Number((data as any)?.page ?? (options?.page ?? 1));
  const totalPages = Number((data as any)?.totalPages ?? 1);
  return { data: rows, total, page, totalPages } as ReviewsPageDto;
}

export async function getProductReviewSummary(productId: number) {
  const data = await apiGetJson<{ data?: unknown }>(`/reviews/product/${productId}/summary`);
  const item = (data as any)?.data;
  return item && typeof item === 'object'
    ? (item as ReviewSummaryDto)
    : { averageRating: 0, totalReviews: 0 };
}

export async function submitReview(input: { product_id: number; customer_name: string; rating: number; comment?: string; website?: string }) {
  return await apiRequestJson<{ data?: ReviewDto }>(`/reviews`, { method: 'POST', body: input });
}

// ── Admin Reviews ───────────────────────────────────────────

export async function adminGetReviews(options?: { status?: string; productId?: number; q?: string; page?: number; limit?: number }) {
  const qs = buildQuery({
    status: options?.status,
    product_id: options?.productId,
    q: options?.q,
    page: options?.page,
    limit: options?.limit,
  });
  const data = await adminRequestJson<any>(`/admin/catalog/reviews${qs}`, { method: 'GET' });
  const rows = Array.isArray((data as any)?.data) ? ((data as any).data as ReviewDto[]) : [];
  const total = Number((data as any)?.total ?? rows.length);
  const page = Number((data as any)?.page ?? (options?.page ?? 1));
  const totalPages = Number((data as any)?.totalPages ?? 1);
  return { data: rows, total, page, totalPages } as ReviewsPageDto;
}

export async function adminUpdateReviewStatus(id: number, status: string) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/reviews/${id}/status`, { method: 'PATCH', body: { status } });
}

export async function adminDeleteReview(id: number) {
  return await adminRequestJson<{ data?: unknown }>(`/admin/catalog/reviews/${id}`, { method: 'DELETE' });
}
