import { orm } from '../shared/bdd/orm.js';
import { Extra } from './extra.entity.js';
import { ExtraScope } from './extra-scope.entity.js';
import { ExtraRepository } from './extra.repository.js';
import { Product } from '../product/product.entity.js';
import { Category } from '../category/category.entity.js';

export type ExtraFilters = {
  categoryType?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
  /** Filtrar extras que apliquen al producto dado */
  productId?: unknown;
  /** Filtrar extras que apliquen a la categoría dada */
  categoryId?: unknown;
};

export type ExtraInput = {
  name?: string;
  price?: string;
  category_type?: string;
  is_active?: number | boolean;
};

export async function findAllExtras(filters: ExtraFilters) {
  const em = orm.em.fork();

  const categoryType = filters.categoryType as any;
  const where: any = {};
  if (typeof categoryType === 'string' && categoryType.trim()) {
    where.categoryType = categoryType.trim();
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

  const productIdRaw = filters.productId as any;
  const productId = productIdRaw != null && String(productIdRaw).trim() !== '' ? Number(productIdRaw) : undefined;

  const categoryIdRaw = filters.categoryId as any;
  const categoryId = categoryIdRaw != null && String(categoryIdRaw).trim() !== '' ? Number(categoryIdRaw) : undefined;

  // Si no se pasan filtros de producto/categoría → traemos todos (comportamiento original)
  if (productId == null && categoryId == null) {
    const data = await ExtraRepository.listAll(em, where);
    return { data };
  }

  // Traemos todos los extras que cumplen los filtros base
  const allExtras = await ExtraRepository.listAll(em, where);
  const extraIds = allExtras.map((e: any) => e.id);

  if (extraIds.length === 0) return { data: [] };

  // Obtenemos todos los scopes de esos extras de una sola consulta
  const scopes = await em.find(ExtraScope as any, { extra: { $in: extraIds } } as any, {
    populate: ['extra'] as any,
  }) as any[];

  // Agrupamos scopes por extra_id
  const scopesByExtraId = new Map<number, Array<{ productId?: number | null; categoryId?: number | null }>>();
  for (const s of scopes) {
    const eid = (s.extra?.id ?? s.extra) as number;
    if (!scopesByExtraId.has(eid)) scopesByExtraId.set(eid, []);
    scopesByExtraId.get(eid)!.push({
      productId: s.product?.id ?? s.product ?? null,
      categoryId: s.category?.id ?? s.category ?? null,
    });
  }

  // Filtramos: incluir extras globales (sin scopes) + extras con scope coincidente
  const data = allExtras.filter((e: any) => {
    const eScopes = scopesByExtraId.get(e.id);
    // Sin scopes → global → siempre incluir
    if (!eScopes || eScopes.length === 0) return true;
    // Con scopes → incluir solo si alguno coincide con productId o categoryId
    return eScopes.some((s) => {
      if (productId != null && s.productId === productId) return true;
      if (categoryId != null && s.categoryId === categoryId) return true;
      return false;
    });
  });

  return { data };
}

export async function findOneExtra(id: number, options?: { includeInactive?: boolean }) {
  const em = orm.em.fork();
  const item = await ExtraRepository.findOne(em, id);
  if (!item) return null;
  if (!options?.includeInactive && (item as any).isActive === false) return null;
  return item;
}

export async function createExtra(input: ExtraInput) {
  const em = orm.em.fork();
  const nuevo = em.create(Extra as any, {
    name: input.name,
    price: input.price,
    categoryType: input.category_type,
    isActive: input.is_active != null ? Boolean(input.is_active) : undefined,
  });
  await em.flush();
  return nuevo;
}

export async function updateExtra(id: number, input: ExtraInput) {
  const em = orm.em.fork();
  const item = await ExtraRepository.findOne(em, id);
  if (!item) return null;

  em.assign(item, {
    name: input.name,
    price: input.price,
    categoryType: input.category_type,
    isActive: input.is_active != null ? Boolean(input.is_active) : undefined,
  } as any, { mergeObjects: true } as any);

  await em.flush();
  return item;
}

export async function removeExtra(id: number) {
  const em = orm.em.fork();
  const item = await ExtraRepository.findOne(em, id);
  if (!item) return null;
  await em.removeAndFlush(item);
  return item;
}

export async function setExtraActive(id: number, isActive: boolean) {
  const em = orm.em.fork();
  const item = await ExtraRepository.findOne(em, id);
  if (!item) return null;
  (item as any).isActive = isActive;
  await em.flush();
  return item;
}

// ── Scopes ─────────────────────────────────────────────────────

export type ExtraScopeInput = {
  /** IDs de productos a los que aplica este extra (reemplaza los anteriores) */
  product_ids?: number[];
  /** IDs de categorías a las que aplica este extra (reemplaza las anteriores) */
  category_ids?: number[];
};

/** Retorna los scopes actuales de un extra */
export async function getExtraScopes(extraId: number) {
  const em = orm.em.fork();
  const scopes = await em.find(ExtraScope as any, { extra: { id: extraId } } as any) as any[];
  return {
    data: {
      productIds: scopes.filter((s: any) => s.product != null).map((s: any) => s.product?.id ?? s.product),
      categoryIds: scopes.filter((s: any) => s.category != null).map((s: any) => s.category?.id ?? s.category),
    },
  };
}

/** Reemplaza completamente los scopes de un extra */
export async function setExtraScopes(extraId: number, input: ExtraScopeInput) {
  const em = orm.em.fork();

  // Verificar que el extra existe
  const extra = await em.findOne(Extra as any, { id: extraId }) as any;
  if (!extra) return null;

  // Eliminar todos los scopes anteriores
  const existing = await em.find(ExtraScope as any, { extra: { id: extraId } } as any) as any[];
  for (const s of existing) {
    em.remove(s);
  }

  // Crear los nuevos scopes de productos
  for (const productId of input.product_ids ?? []) {
    const scope = em.create(ExtraScope as any, {
      extra,
      product: em.getReference(Product as any, productId),
      category: null,
    });
    em.persist(scope);
  }

  // Crear los nuevos scopes de categorías
  for (const categoryId of input.category_ids ?? []) {
    const scope = em.create(ExtraScope as any, {
      extra,
      product: null,
      category: em.getReference(Category as any, categoryId),
    });
    em.persist(scope);
  }

  await em.flush();

  return await getExtraScopes(extraId);
}
