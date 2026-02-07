import { Request, Response } from 'express';
import {
  listAdminProducts,
  getAdminProduct,
  setAdminProductActive,
  listAdminCategories,
  getAdminCategory,
  setAdminCategoryActive,
  listAdminVariants,
  getAdminVariant,
  setAdminVariantActive,
  listAdminExtras,
  getAdminExtra,
  setAdminExtraActive,
} from './admin-catalog.service.js';

function parseBoolean(value: any) {
  if (value == null || String(value).trim() === '') return undefined;
  return value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value) === '1';
}

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
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Producto encontrado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener producto (admin)', error });
  }
}

export async function setProductActive(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const isActive = parseBoolean((req.body as any)?.is_active ?? (req.body as any)?.isActive);
    if (isActive === undefined) return res.status(400).json({ message: 'is_active es requerido' });
    const item = await setAdminProductActive(id, isActive);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Producto actualizado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar producto (admin)', error });
  }
}

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
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Categoría encontrada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener categoría (admin)', error });
  }
}

export async function setCategoryActive(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const isActive = parseBoolean((req.body as any)?.is_active ?? (req.body as any)?.isActive);
    if (isActive === undefined) return res.status(400).json({ message: 'is_active es requerido' });
    const item = await setAdminCategoryActive(id, isActive);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Categoría actualizada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar categoría (admin)', error });
  }
}

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
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Variante encontrada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener variante (admin)', error });
  }
}

export async function setVariantActive(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const isActive = parseBoolean((req.body as any)?.is_active ?? (req.body as any)?.isActive);
    if (isActive === undefined) return res.status(400).json({ message: 'is_active es requerido' });
    const item = await setAdminVariantActive(id, isActive);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Variante actualizada', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar variante (admin)', error });
  }
}

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
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Extra encontrado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener extra (admin)', error });
  }
}

export async function setExtraActive(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const isActive = parseBoolean((req.body as any)?.is_active ?? (req.body as any)?.isActive);
    if (isActive === undefined) return res.status(400).json({ message: 'is_active es requerido' });
    const item = await setAdminExtraActive(id, isActive);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    return res.status(200).json({ message: 'Extra actualizado', data: item });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar extra (admin)', error });
  }
}
