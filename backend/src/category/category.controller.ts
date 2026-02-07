import { Request, Response } from 'express';
import {
  findAllCategories,
  findOneCategory,
  createCategory,
  updateCategory,
  removeCategory,
} from './category.service.js';

async function findAll(req: Request, res: Response) {
  try {
    const result = await findAllCategories({
      includeRepresentative: req.query.include_representative ?? req.query.includeRepresentative,
    });
    return res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await findOneCategory(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Categoría encontrada', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categoría', error });
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const nuevo = await createCategory(input);
    res.status(201).json({ message: 'Categoría creada', data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear categoría', error: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await updateCategory(id, (req.body as any).sanitizedInput || req.body);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).send({ message: 'Categoría actualizada', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al actualizar categoría', error });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await removeCategory(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).send({ message: 'Categoría borrada', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al borrar categoría', error });
  }
}

export { findAll, findOne, add, update, remove };
