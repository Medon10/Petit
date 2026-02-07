import { orm } from '../shared/bdd/orm.js';
import { Variant } from './variant.entity.js';
import { VariantRepository } from './variant.repository.js';

export type VariantFilters = {
  productId?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
};

export type VariantInput = {
  product_id?: number;
  name?: string;
  price?: string;
  is_active?: number | boolean;
};

export async function findAllVariants(filters: VariantFilters) {
  const em = orm.em.fork();

  const productIdRaw = filters.productId as any;
  const productId = productIdRaw != null && productIdRaw !== '' ? Number(productIdRaw) : undefined;

  const where: any = {};
  if (productId != null && !Number.isNaN(productId)) {
    where.product = productId;
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

  const data = await VariantRepository.listAll(em, where);
  return { data };
}

export async function findOneVariant(id: number, options?: { includeInactive?: boolean }) {
  const em = orm.em.fork();
  const item = await VariantRepository.findOne(em, id);
  if (!item) return null;
  if (!options?.includeInactive && (item as any).isActive === false) return null;
  return item;
}

export async function createVariant(input: VariantInput) {
  const em = orm.em.fork();

  const productId = input.product_id;
  if (!productId) throw new Error('product_id es requerido');

  const product = await VariantRepository.findProductOrThrow(em, productId);

  const nuevo = em.create(Variant as any, {
    product,
    name: input.name,
    price: input.price,
    isActive: input.is_active != null ? Boolean(input.is_active) : undefined,
  });

  await em.flush();
  return nuevo;
}

export async function updateVariant(id: number, input: VariantInput) {
  const em = orm.em.fork();
  const item = await VariantRepository.findOnePlain(em, id);
  if (!item) return null;

  if (input.product_id != null) {
    const product = await VariantRepository.findProductOrThrow(em, input.product_id);
    (item as any).product = product;
  }

  em.assign(item, {
    name: input.name,
    price: input.price,
    isActive: input.is_active != null ? Boolean(input.is_active) : undefined,
  } as any, { mergeObjects: true } as any);

  await em.flush();
  return item;
}

export async function removeVariant(id: number) {
  const em = orm.em.fork();
  const item = await VariantRepository.findOnePlain(em, id);
  if (!item) return null;
  await em.removeAndFlush(item);
  return item;
}

export async function setVariantActive(id: number, isActive: boolean) {
  const em = orm.em.fork();
  const item = await VariantRepository.findOnePlain(em, id);
  if (!item) return null;
  (item as any).isActive = isActive;
  await em.flush();
  return item;
}
