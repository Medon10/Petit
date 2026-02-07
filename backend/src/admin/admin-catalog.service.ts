import { findAllProducts, findOneProduct, setProductActive } from '../product/product.service.js';
import { findAllCategories, findOneCategory, setCategoryActive } from '../category/category.service.js';
import { findAllVariants, findOneVariant, setVariantActive } from '../variant/variant.service.js';
import { findAllExtras, findOneExtra, setExtraActive } from '../extra/extra.service.js';

export async function listAdminProducts(params: {
  categoryId?: unknown;
  featured?: unknown;
  limit?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
}) {
  return await findAllProducts({
    categoryId: params.categoryId,
    featured: params.featured,
    limit: params.limit,
    includeInactive: params.includeInactive,
    isActive: params.isActive,
  });
}

export async function getAdminProduct(id: number) {
  return await findOneProduct(id, { includeInactive: true });
}

export async function setAdminProductActive(id: number, isActive: boolean) {
  return await setProductActive(id, isActive);
}

export async function listAdminCategories(params: {
  includeRepresentative?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
}) {
  return await findAllCategories({
    includeRepresentative: params.includeRepresentative,
    includeInactive: params.includeInactive,
    isActive: params.isActive,
  });
}

export async function getAdminCategory(id: number) {
  return await findOneCategory(id, { includeInactive: true });
}

export async function setAdminCategoryActive(id: number, isActive: boolean) {
  return await setCategoryActive(id, isActive);
}

export async function listAdminVariants(params: {
  productId?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
}) {
  return await findAllVariants({
    productId: params.productId,
    includeInactive: params.includeInactive,
    isActive: params.isActive,
  });
}

export async function getAdminVariant(id: number) {
  return await findOneVariant(id, { includeInactive: true });
}

export async function setAdminVariantActive(id: number, isActive: boolean) {
  return await setVariantActive(id, isActive);
}

export async function listAdminExtras(params: {
  categoryType?: unknown;
  includeInactive?: unknown;
  isActive?: unknown;
}) {
  return await findAllExtras({
    categoryType: params.categoryType,
    includeInactive: params.includeInactive,
    isActive: params.isActive,
  });
}

export async function getAdminExtra(id: number) {
  return await findOneExtra(id, { includeInactive: true });
}

export async function setAdminExtraActive(id: number, isActive: boolean) {
  return await setExtraActive(id, isActive);
}
