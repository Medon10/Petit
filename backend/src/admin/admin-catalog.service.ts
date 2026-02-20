import {
  findAllProducts, findOneProduct, createProduct, updateProduct, removeProduct, setProductActive,
} from '../product/product.service.js';
import {
  findAllCategories, findOneCategory, createCategory, updateCategory, removeCategory, setCategoryActive,
} from '../category/category.service.js';
import {
  findAllVariants, findOneVariant, createVariant, updateVariant, removeVariant, setVariantActive,
} from '../variant/variant.service.js';
import {
  findAllExtras, findOneExtra, createExtra, updateExtra, removeExtra, setExtraActive,
} from '../extra/extra.service.js';
import {
  listOrders as listOrdersSvc, getOrderById, updateOrderStatus,
} from '../order/order.service.js';

// ── Products ────────────────────────────────────────────────

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

export async function createAdminProduct(input: any) {
  return await createProduct(input);
}

export async function updateAdminProduct(id: number, input: any) {
  return await updateProduct(id, input);
}

export async function removeAdminProduct(id: number) {
  return await removeProduct(id);
}

export async function setAdminProductActive(id: number, isActive: boolean) {
  return await setProductActive(id, isActive);
}

// ── Categories ──────────────────────────────────────────────

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

export async function createAdminCategory(input: any) {
  return await createCategory(input);
}

export async function updateAdminCategory(id: number, input: any) {
  return await updateCategory(id, input);
}

export async function removeAdminCategory(id: number) {
  return await removeCategory(id);
}

export async function setAdminCategoryActive(id: number, isActive: boolean) {
  return await setCategoryActive(id, isActive);
}

// ── Variants ────────────────────────────────────────────────

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

export async function createAdminVariant(input: any) {
  return await createVariant(input);
}

export async function updateAdminVariant(id: number, input: any) {
  return await updateVariant(id, input);
}

export async function removeAdminVariant(id: number) {
  return await removeVariant(id);
}

export async function setAdminVariantActive(id: number, isActive: boolean) {
  return await setVariantActive(id, isActive);
}

// ── Extras ──────────────────────────────────────────────────

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

export async function createAdminExtra(input: any) {
  return await createExtra(input);
}

export async function updateAdminExtra(id: number, input: any) {
  return await updateExtra(id, input);
}

export async function removeAdminExtra(id: number) {
  return await removeExtra(id);
}

export async function setAdminExtraActive(id: number, isActive: boolean) {
  return await setExtraActive(id, isActive);
}

// ── Orders (admin) ──────────────────────────────────────────

export async function listAdminOrders(params: { limit?: unknown }) {
  return await listOrdersSvc(params);
}

export async function getAdminOrder(id: number) {
  return await getOrderById(id);
}

export async function setAdminOrderStatus(id: number, status: string) {
  return await updateOrderStatus(id, status);
}
