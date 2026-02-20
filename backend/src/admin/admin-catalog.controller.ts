import { Request, Response } from 'express';
import { parseBool } from '../shared/utils/parsers.js';
import {
  listAdminProducts,
  getAdminProduct,
  createAdminProduct,
  updateAdminProduct,
  removeAdminProduct,
  setAdminProductActive,
  listAdminCategories,
  getAdminCategory,
  createAdminCategory,
  updateAdminCategory,
  removeAdminCategory,
  setAdminCategoryActive,
  listAdminVariants,
  getAdminVariant,
  createAdminVariant,
  updateAdminVariant,
  removeAdminVariant,
  setAdminVariantActive,
  listAdminExtras,
  getAdminExtra,
  createAdminExtra,
  updateAdminExtra,
  removeAdminExtra,
  setAdminExtraActive,
  listAdminOrders,
  getAdminOrder,
  setAdminOrderStatus,
} from './admin-catalog.service.js';

// ── Products ────────────────────────────────────────────────

export async function listProducts(req: Request, res: Response) {
  try {
    const result = await listAdminProducts({
      categoryId: req.query.category_id ?? req.query.categoryId,
      featured: req.query.featured ?? req.query.is_featured ?? req.query.isFeatured,
      limit: req.query.limit ?? req.query.take,
      includeInactive: req.query.include_inactive ?? req.query.includeInactive,
      isActive: req.query.is_active ?? req.query.isActive,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener productos (admin)', error });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await getAdminProduct(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Producto encontrado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener producto (admin)', error });
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await createAdminProduct(input);
    return res.status(201).json({ message: 'Producto creado', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al crear producto' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await updateAdminProduct(id, input);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Producto actualizado', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al actualizar producto' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await removeAdminProduct(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Producto eliminado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar producto (admin)', error });
  }
}

export async function setProductActive(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const isActive = parseBool((req.body as any)?.is_active ?? (req.body as any)?.isActive);
    if (isActive === undefined) return res.status(400).json({ message: 'is_active es requerido' });
    const item = await setAdminProductActive(id, isActive);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Producto actualizado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar producto (admin)', error });
  }
}

// ── Categories ──────────────────────────────────────────────

export async function listCategories(req: Request, res: Response) {
  try {
    const result = await listAdminCategories({
      includeRepresentative: req.query.include_representative ?? req.query.includeRepresentative,
      includeInactive: req.query.include_inactive ?? req.query.includeInactive,
      isActive: req.query.is_active ?? req.query.isActive,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener categorías (admin)', error });
  }
}

export async function getCategory(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await getAdminCategory(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Categoría encontrada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener categoría (admin)', error });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await createAdminCategory(input);
    return res.status(201).json({ message: 'Categoría creada', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al crear categoría' });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await updateAdminCategory(id, input);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Categoría actualizada', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al actualizar categoría' });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await removeAdminCategory(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Categoría eliminada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar categoría (admin)', error });
  }
}

export async function setCategoryActive(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const isActive = parseBool((req.body as any)?.is_active ?? (req.body as any)?.isActive);
    if (isActive === undefined) return res.status(400).json({ message: 'is_active es requerido' });
    const item = await setAdminCategoryActive(id, isActive);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Categoría actualizada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar categoría (admin)', error });
  }
}

// ── Variants ────────────────────────────────────────────────

export async function listVariants(req: Request, res: Response) {
  try {
    const result = await listAdminVariants({
      productId: req.query.product_id ?? req.query.productId,
      includeInactive: req.query.include_inactive ?? req.query.includeInactive,
      isActive: req.query.is_active ?? req.query.isActive,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener variantes (admin)', error });
  }
}

export async function getVariant(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await getAdminVariant(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Variante encontrada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener variante (admin)', error });
  }
}

export async function createVariant(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await createAdminVariant(input);
    return res.status(201).json({ message: 'Variante creada', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al crear variante' });
  }
}

export async function updateVariant(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await updateAdminVariant(id, input);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Variante actualizada', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al actualizar variante' });
  }
}

export async function deleteVariant(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await removeAdminVariant(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Variante eliminada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar variante (admin)', error });
  }
}

export async function setVariantActive(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const isActive = parseBool((req.body as any)?.is_active ?? (req.body as any)?.isActive);
    if (isActive === undefined) return res.status(400).json({ message: 'is_active es requerido' });
    const item = await setAdminVariantActive(id, isActive);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Variante actualizada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar variante (admin)', error });
  }
}

// ── Extras ──────────────────────────────────────────────────

export async function listExtras(req: Request, res: Response) {
  try {
    const result = await listAdminExtras({
      categoryType: req.query.category_type ?? req.query.categoryType,
      includeInactive: req.query.include_inactive ?? req.query.includeInactive,
      isActive: req.query.is_active ?? req.query.isActive,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener extras (admin)', error });
  }
}

export async function getExtra(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await getAdminExtra(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Extra encontrado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener extra (admin)', error });
  }
}

export async function createExtra(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await createAdminExtra(input);
    return res.status(201).json({ message: 'Extra creado', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al crear extra' });
  }
}

export async function updateExtra(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await updateAdminExtra(id, input);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Extra actualizado', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al actualizar extra' });
  }
}

export async function deleteExtra(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await removeAdminExtra(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Extra eliminado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar extra (admin)', error });
  }
}

export async function setExtraActive(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const isActive = parseBool((req.body as any)?.is_active ?? (req.body as any)?.isActive);
    if (isActive === undefined) return res.status(400).json({ message: 'is_active es requerido' });
    const item = await setAdminExtraActive(id, isActive);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Extra actualizado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar extra (admin)', error });
  }
}

// ── Orders ──────────────────────────────────────────────────

export async function listOrders(req: Request, res: Response) {
  try {
    const result = await listAdminOrders({
      limit: req.query.limit ?? req.query.take,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener pedidos (admin)', error });
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await getAdminOrder(id);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Pedido encontrado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener pedido (admin)', error });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const status = String((req.body as any)?.status ?? '').trim();
    if (!status) return res.status(400).json({ message: 'status es requerido' });
    const item = await setAdminOrderStatus(id, status);
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Pedido actualizado', data: item });
  } catch (error: any) {
    return res.status(400).json({ message: error?.message || 'Error al actualizar pedido' });
  }
}
