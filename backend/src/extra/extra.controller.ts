import { Request, Response } from 'express';
import { orm } from '../shared/bdd/orm.js';
import { Extra } from './extra.entity.js';

async function findAll(req: Request, res: Response) {
  try {
    const em = orm.em.fork();

    const categoryType = (req.query.category_type ?? req.query.categoryType) as any;
    const where: any = {};
    if (typeof categoryType === 'string' && categoryType.trim()) {
      where.categoryType = categoryType.trim();
    }

    const data = await em.find(Extra as any, where, { orderBy: { name: 'ASC' } as any } as any);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener extras', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Extra as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Extra encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener extra', error });
  }
}

async function add(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const input = (req.body as any).sanitizedInput || req.body;

    const nuevo = em.create(Extra as any, {
      name: input.name,
      price: input.price,
      categoryType: input.category_type,
    });

    await em.flush();
    res.status(201).json({ message: 'Extra creado', data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear extra', error: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Extra as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });

    const input = (req.body as any).sanitizedInput || req.body;

    em.assign(item, {
      name: input.name,
      price: input.price,
      categoryType: input.category_type,
    } as any, { mergeObjects: true } as any);

    await em.flush();
    res.status(200).send({ message: 'Extra actualizado', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al actualizar extra', error });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Extra as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    await em.removeAndFlush(item);
    res.status(200).send({ message: 'Extra borrado', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al borrar extra', error });
  }
}

export { findAll, findOne, add, update, remove };
