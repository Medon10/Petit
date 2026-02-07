import { orm } from '../shared/bdd/orm.js';
import { Category } from './category.entity.js';
import { CategoryRepository } from './category.repository.js';

export type CategoryFilters = {
  includeRepresentative?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
};

export type CategoryInput = {
  name?: string;
  is_active?: number | boolean;
};

function parseInclude(value: unknown) {
  if (value == null) return false;
  return value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value) === '1';
}

export async function findAllCategories(filters: CategoryFilters) {
  const em = orm.em.fork();
  const includeRepresentative = parseInclude(filters.includeRepresentative);

  const includeInactiveRaw = filters.includeInactive as any;
  const includeInactive = includeInactiveRaw === true || includeInactiveRaw === 1 || String(includeInactiveRaw).toLowerCase() === 'true' || String(includeInactiveRaw) === '1';

  const isActiveRaw = filters.isActive as any;
  const isActiveParsed = isActiveRaw == null || String(isActiveRaw).trim() === ''
    ? undefined
    : (isActiveRaw === true || isActiveRaw === 1 || String(isActiveRaw).toLowerCase() === 'true' || String(isActiveRaw) === '1');

  if (!includeRepresentative) {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    } else if (isActiveParsed !== undefined) {
      where.isActive = isActiveParsed;
    }

    const data = await CategoryRepository.listAll(em, where);
    return { data };
  }

  const data = await CategoryRepository.representativeRows(em);
  return { data };
}

export async function findOneCategory(id: number, options?: { includeInactive?: boolean }) {
  const em = orm.em.fork();
  const item = await CategoryRepository.findOneWithProducts(em, id);
  if (!item) return null;
  if (!options?.includeInactive && (item as any).isActive === false) return null;
  return item;
}

export async function createCategory(input: CategoryInput) {
  const em = orm.em.fork();
  const nuevo = em.create(Category as any, input);
  await em.flush();
  return nuevo;
}

export async function updateCategory(id: number, input: CategoryInput) {
  const em = orm.em.fork();
  const item = await CategoryRepository.findOnePlain(em, id);
  if (!item) return null;
  em.assign(item, input as any);
  await em.flush();
  return item;
}

export async function setCategoryActive(id: number, isActive: boolean) {
  const em = orm.em.fork();
  const item = await CategoryRepository.findOnePlain(em, id);
  if (!item) return null;
  (item as any).isActive = isActive;
  await em.flush();
  return item;
}

export async function removeCategory(id: number) {
  const em = orm.em.fork();
  const item = await CategoryRepository.findOnePlain(em, id);
  if (!item) return null;
  await em.removeAndFlush(item);
  return item;
}
