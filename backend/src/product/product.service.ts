import { orm } from '../shared/bdd/orm.js';
import { Product } from './product.entity.js';
import { ProductRepository } from './product.repository.js';

export type ProductFilters = {
  categoryId?: unknown;
  featured?: unknown;
  limit?: unknown;
  page?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
};

export type ProductInput = {
  category_id?: number;
  name?: string;
  description?: string;
  image_url?: string;
  gallery_images?: string[];
  is_featured?: number | boolean;
  featured_rank?: number;
  is_active?: number | boolean;
};

function parseFeatured(value: unknown) {
  if (value == null || String(value).trim() === '') return undefined;
  return value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value) === '1';
}

export async function findAllProducts(filters: ProductFilters) {
  const em = orm.em.fork();

  const categoryIdRaw = filters.categoryId as any;
  const categoryId = categoryIdRaw != null && categoryIdRaw !== '' ? Number(categoryIdRaw) : undefined;

  const where: any = {};
  if (categoryId != null && !Number.isNaN(categoryId)) {
    where.category = categoryId;
  }

  const featured = parseFeatured(filters.featured);
  if (featured === true) {
    where.isFeatured = true;
  }

  const includeInactiveRaw = filters.includeInactive as any;
  const includeInactive = includeInactiveRaw === true || includeInactiveRaw === 1 || String(includeInactiveRaw).toLowerCase() === 'true' || String(includeInactiveRaw) === '1';

  const isActiveRaw = filters.isActive as any;
  const isActiveParsed = isActiveRaw == null || String(isActiveRaw).trim() === ''
    ? undefined
    : (isActiveRaw === true || isActiveRaw === 1 || String(isActiveRaw).toLowerCase() === 'true' || String(isActiveRaw) === '1');

  if (!includeInactive) {
    where.isActive = true;
  } else if (isActiveParsed !== undefined) {
    where.isActive = isActiveParsed;
  }

  const limitRaw = filters.limit as any;
  const limitParsed = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 12;
  const limit = Number.isFinite(limitParsed) ? Math.min(Math.max(1, limitParsed), 50) : 12;

  const pageRaw = filters.page as any;
  const pageParsed = pageRaw != null && String(pageRaw).trim() !== '' ? Number(pageRaw) : 1;
  const page = Number.isFinite(pageParsed) ? Math.max(1, pageParsed) : 1;

  const offset = (page - 1) * limit;

  const [data, total] = await ProductRepository.listProductsAndCount(em, where, {
    populate: ['category'] as any,
    orderBy: featured === true
      ? ({ featuredRank: 'ASC', name: 'ASC' } as any)
      : ({ name: 'ASC' } as any),
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { data, total, page, totalPages };
}

export async function findOneProduct(id: number, options?: { includeInactive?: boolean }) {
  const em = orm.em.fork();
  const item = await ProductRepository.findProduct(em, id);
  if (!item) return null;
  if (!options?.includeInactive && (item as any).isActive === false) return null;
  return item;
}

export async function createProduct(input: ProductInput) {
  const em = orm.em.fork();

  const categoryId = input.category_id;
  if (!categoryId) throw new Error('category_id es requerido');

  const category = await ProductRepository.findCategoryOrThrow(em, categoryId);

  const nuevo = em.create(Product as any, {
    category,
    name: input.name,
    description: input.description,
    imageUrl: input.image_url,
    galleryImages: Array.isArray(input.gallery_images) ? input.gallery_images : undefined,
    isFeatured: input.is_featured != null ? Boolean(input.is_featured) : undefined,
    featuredRank: input.featured_rank != null && !Number.isNaN(Number(input.featured_rank)) ? Number(input.featured_rank) : undefined,
    isActive: input.is_active != null ? Boolean(input.is_active) : undefined,
  });

  await em.flush();
  return nuevo;
}

export async function updateProduct(id: number, input: ProductInput) {
  const em = orm.em.fork();
  const item = await ProductRepository.findProductPlain(em, id);
  if (!item) return null;

  if (input.category_id != null) {
    const category = await ProductRepository.findCategoryOrThrow(em, input.category_id);
    (item as any).category = category;
  }

  em.assign(item, {
    name: input.name,
    description: input.description,
    imageUrl: input.image_url,
    galleryImages: Array.isArray(input.gallery_images) ? input.gallery_images : undefined,
    isFeatured: input.is_featured != null ? Boolean(input.is_featured) : undefined,
    featuredRank: input.featured_rank != null && !Number.isNaN(Number(input.featured_rank)) ? Number(input.featured_rank) : undefined,
    isActive: input.is_active != null ? Boolean(input.is_active) : undefined,
  } as any, { mergeObjects: true } as any);

  await em.flush();
  return item;
}

export async function removeProduct(id: number) {
  const em = orm.em.fork();
  const item = await ProductRepository.findProductPlain(em, id);
  if (!item) return null;
  await em.removeAndFlush(item);
  return item;
}

export async function setProductActive(id: number, isActive: boolean) {
  const em = orm.em.fork();
  const item = await ProductRepository.findProductPlain(em, id);
  if (!item) return null;
  (item as any).isActive = isActive;
  await em.flush();
  return item;
}

export async function bestSellers(limitRaw?: unknown) {
  const em = orm.em.fork();

  const limit = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 8;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), 50) : 8;

  const ids = await ProductRepository.bestSellerIds(em, safeLimit);
  if (ids.length === 0) return { data: [] };

  const products = await ProductRepository.listProducts(em, { id: { $in: ids } as any, isActive: true } as any, {
    populate: ['category'] as any,
  });

  const byId = new Map<number, any>(products.map((p: any) => [Number(p.id), p]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  return { data: ordered };
}

export async function searchProducts(queryRaw?: unknown, pageRaw?: unknown, limitRaw?: unknown) {
  const em = orm.em.fork();
  const query = String(queryRaw ?? '').trim();
  if (!query) return { data: [], total: 0, page: 1, totalPages: 1 };

  const limitParsed = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 20;
  const limit = Number.isFinite(limitParsed) ? Math.min(Math.max(1, limitParsed), 50) : 20;

  const pageParsed = pageRaw != null && String(pageRaw).trim() !== '' ? Number(pageRaw) : 1;
  const page = Number.isFinite(pageParsed) ? Math.max(1, pageParsed) : 1;

  const offset = (page - 1) * limit;

  const pattern = `%${query}%`;
  const [data, total] = await ProductRepository.listProductsAndCount(em, {
    isActive: true,
    $or: [
      { name: { $ilike: pattern } as any },
      { description: { $ilike: pattern } as any },
    ],
  } as any, {
    populate: ['category', 'variants'] as any,
    orderBy: { name: 'ASC' } as any,
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { data, total, page, totalPages };
}
