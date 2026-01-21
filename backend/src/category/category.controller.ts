import { Request, Response } from 'express';
import { orm } from '../shared/bdd/orm.js';
import { Category } from './category.entity.js';

async function findAll(req: Request, res: Response) {
  try {
    const em = orm.em.fork();

    const includeRepresentativeRaw = (req.query.include_representative ?? req.query.includeRepresentative) as any;
    const includeRepresentative =
      includeRepresentativeRaw === true ||
      includeRepresentativeRaw === 1 ||
      String(includeRepresentativeRaw).toLowerCase() === 'true' ||
      String(includeRepresentativeRaw) === '1';

    if (!includeRepresentative) {
      const data = await em.find(Category as any, {}, { orderBy: { name: 'ASC' } as any } as any);
      return res.json({ data });
    }

    // Representative image: pick the first product in the category that has image_url.
    // Heuristic order: featured first, then rank, then id.
    const rows = await em.getConnection().execute(
      `
      SELECT
        c.id,
        c.name,
        (
          SELECT p.image_url
          FROM products p
          WHERE p.category_id = c.id
            AND p.image_url IS NOT NULL
            AND p.image_url <> ''
          ORDER BY p.is_featured DESC, p.featured_rank ASC, p.id ASC
          LIMIT 1
        ) AS representativeImageUrl
      FROM categories c
      ORDER BY c.name ASC
      `
    );

    const data = (rows as any[]).map((r) => ({
      id: Number(r.id),
      name: r.name,
      representativeImageUrl: r.representativeImageUrl ?? null,
    }));

    return res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Category as any, { id }, { populate: ['products'] as any } as any);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Categoría encontrada', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categoría', error });
  }
}

async function add(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const input = (req.body as any).sanitizedInput || req.body;
    const nuevo = em.create(Category as any, input);
    await em.flush();
    res.status(201).json({ message: 'Categoría creada', data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear categoría', error: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Category as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    em.assign(item, (req.body as any).sanitizedInput || req.body);
    await em.flush();
    res.status(200).send({ message: 'Categoría actualizada', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al actualizar categoría', error });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Category as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    await em.removeAndFlush(item);
    res.status(200).send({ message: 'Categoría borrada', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al borrar categoría', error });
  }
}

export { findAll, findOne, add, update, remove };
