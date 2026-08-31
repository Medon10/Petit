import { Request, Response } from 'express';
import {
  findAllExtras,
  findOneExtra,
  createExtra,
  updateExtra,
  removeExtra,
  getExtraScopes,
  setExtraScopes,
} from './extra.service.js';

async function findAll(req: Request, res: Response) {
  try {
    const result = await findAllExtras({
      categoryType: req.query.category_type ?? req.query.categoryType,
      productId: req.query.product_id ?? req.query.productId,
      categoryId: req.query.category_id ?? req.query.categoryId,
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

async function getScopes(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const result = await getExtraScopes(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener scopes del extra', error });
  }
}

async function putScopes(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const body = req.body as any;
    const productIds = Array.isArray(body.product_ids) ? body.product_ids.map(Number) : [];
    const categoryIds = Array.isArray(body.category_ids) ? body.category_ids.map(Number) : [];
    const result = await setExtraScopes(id, { product_ids: productIds, category_ids: categoryIds });
    if (!result) return res.status(404).json({ message: 'Extra no encontrado' });
    res.status(200).json({ message: 'Scopes actualizados', ...result });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar scopes del extra', error });
  }
}

export { findAll, findOne, add, update, remove, getScopes, putScopes };
