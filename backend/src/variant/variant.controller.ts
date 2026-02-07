import { Request, Response } from 'express';
import {
  findAllVariants,
  findOneVariant,
  createVariant,
  updateVariant,
  removeVariant,
} from './variant.service.js';

async function findAll(req: Request, res: Response) {
  try {
    const result = await findAllVariants({
      productId: req.query.product_id ?? req.query.productId,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener variantes', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await findOneVariant(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Variante encontrada', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener variante', error });
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const nuevo = await createVariant(input);
    res.status(201).json({ message: 'Variante creada', data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear variante', error: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await updateVariant(id, input);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).send({ message: 'Variante actualizada', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al actualizar variante', error });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await removeVariant(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).send({ message: 'Variante borrada', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al borrar variante', error });
  }
}

export { findAll, findOne, add, update, remove };
