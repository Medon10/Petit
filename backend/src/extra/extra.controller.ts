import { Request, Response } from 'express';
import {
  findAllExtras,
  findOneExtra,
  createExtra,
  updateExtra,
  removeExtra,
} from './extra.service.js';

async function findAll(req: Request, res: Response) {
  try {
    const result = await findAllExtras({
      categoryType: req.query.category_type ?? req.query.categoryType,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener extras', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await findOneExtra(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Extra encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener extra', error });
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const nuevo = await createExtra(input);
    res.status(201).json({ message: 'Extra creado', data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear extra', error: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await updateExtra(id, input);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).send({ message: 'Extra actualizado', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al actualizar extra', error });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await removeExtra(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).send({ message: 'Extra borrado', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al borrar extra', error });
  }
}

export { findAll, findOne, add, update, remove };
