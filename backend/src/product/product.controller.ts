import { Request, Response } from 'express';
import {
  findAllProducts,
  findOneProduct,
  createProduct,
  updateProduct,
  removeProduct,
  bestSellers as bestSellersService,
} from './product.service.js';

async function findAll(req: Request, res: Response) {
  try {
    const result = await findAllProducts({
      categoryId: req.query.category_id ?? req.query.categoryId,
      featured: req.query.featured ?? req.query.is_featured ?? req.query.isFeatured,
      limit: req.query.limit ?? req.query.take,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await findOneProduct(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Producto encontrado', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error });
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = (req.body as any).sanitizedInput || req.body;
    const nuevo = await createProduct(input);
    res.status(201).json({ message: 'Producto creado', data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const input = (req.body as any).sanitizedInput || req.body;
    const item = await updateProduct(id, input);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).send({ message: 'Producto actualizado', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al actualizar producto', error });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await removeProduct(id);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).send({ message: 'Producto borrado', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al borrar producto', error });
  }
}

async function bestSellers(req: Request, res: Response) {
  try {
    const result = await bestSellersService(req.query.limit ?? req.query.take);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener más vendidos', error });
  }
}

export { findAll, findOne, add, update, remove, bestSellers };
