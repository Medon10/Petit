import { Request, Response } from 'express';
import { orm } from '../shared/bdd/orm.js';
import { Product } from './product.entity.js';
import { Category } from '../category/category.entity.js';

async function findAll(req: Request, res: Response) {
  try {
    const em = orm.em.fork();

    const categoryIdRaw = (req.query.category_id ?? req.query.categoryId) as any;
    const categoryId = categoryIdRaw != null && categoryIdRaw !== '' ? Number(categoryIdRaw) : undefined;

    const where: any = {};
    if (categoryId != null && !Number.isNaN(categoryId)) {
      where.category = categoryId;
    }

    const featuredRaw = (req.query.featured ?? req.query.is_featured ?? req.query.isFeatured) as any;
    const featured = featuredRaw != null && String(featuredRaw).trim() !== ''
      ? (featuredRaw === true || featuredRaw === 1 || String(featuredRaw).toLowerCase() === 'true' || String(featuredRaw) === '1')
      : undefined;

    if (featured === true) {
      where.isFeatured = true;
    }

    const limitRaw = (req.query.limit ?? req.query.take) as any;
    const limit = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : undefined;

    const data = await em.find(Product as any, where, {
      populate: ['category', 'variants'] as any,
      orderBy: featured === true
        ? ({ featuredRank: 'ASC', name: 'ASC' } as any)
        : ({ name: 'ASC' } as any),
      ...(limit != null && !Number.isNaN(limit) ? { limit } : {}),
    } as any);

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Product as any, { id }, { populate: ['category', 'variants'] as any } as any);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Producto encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error });
  }
}

async function add(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const input = (req.body as any).sanitizedInput || req.body;

    const categoryId = input.category_id;
    if (!categoryId) return res.status(400).json({ message: 'category_id es requerido' });

    const category = await em.findOne(Category as any, { id: categoryId });
    if (!category) return res.status(400).json({ message: 'category_id inválido' });

    const nuevo = em.create(Product as any, {
      category,
      name: input.name,
      description: input.description,
      imageUrl: input.image_url,
      isFeatured: input.is_featured != null ? Boolean(input.is_featured) : undefined,
      featuredRank: input.featured_rank != null && !Number.isNaN(Number(input.featured_rank)) ? Number(input.featured_rank) : undefined,
    });

    await em.flush();
    res.status(201).json({ message: 'Producto creado', data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Product as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });

    const input = (req.body as any).sanitizedInput || req.body;

    if (input.category_id != null) {
      const category = await em.findOne(Category as any, { id: input.category_id });
      if (!category) return res.status(400).json({ message: 'category_id inválido' });
      (item as any).category = category;
    }

    em.assign(item, {
      name: input.name,
      description: input.description,
      imageUrl: input.image_url,
      isFeatured: input.is_featured != null ? Boolean(input.is_featured) : undefined,
      featuredRank: input.featured_rank != null && !Number.isNaN(Number(input.featured_rank)) ? Number(input.featured_rank) : undefined,
    } as any, { mergeObjects: true } as any);

    await em.flush();
    res.status(200).send({ message: 'Producto actualizado', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al actualizar producto', error });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Product as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    await em.removeAndFlush(item);
    res.status(200).send({ message: 'Producto borrado', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al borrar producto', error });
  }
}

async function bestSellers(req: Request, res: Response) {
  try {
    const em = orm.em.fork();

    const limitRaw = (req.query.limit ?? req.query.take) as any;
    const limit = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 8;
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), 50) : 8;

    // Aggregate from order_items
    const rows = await em.getConnection().execute(
      'SELECT product_id, SUM(quantity) AS qty FROM order_items GROUP BY product_id ORDER BY qty DESC LIMIT ?',
      [safeLimit]
    );

    const ids = (rows as any[]).map((r) => Number(r.product_id)).filter((n) => Number.isFinite(n));
    if (ids.length === 0) return res.json({ data: [] });

    const products = await em.find(Product as any, { id: { $in: ids } as any } as any, {
      populate: ['category', 'variants'] as any,
    } as any);

    const byId = new Map<number, any>(products.map((p: any) => [Number(p.id), p]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
    return res.json({ data: ordered });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener más vendidos', error });
  }
}

export { findAll, findOne, add, update, remove, bestSellers };
