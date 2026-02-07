import { orm } from '../shared/bdd/orm.js';
import { Extra } from './extra.entity.js';
import { ExtraRepository } from './extra.repository.js';

export type ExtraFilters = {
  categoryType?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
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

  const data = await ExtraRepository.listAll(em, where);
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
