import { Request, Response } from 'express';
import { orm } from '../shared/bdd/orm.js';
import { Variant } from './variant.entity.js';
import { Product } from '../product/product.entity.js';

async function findAll(req: Request, res: Response) {
  try {
    const em = orm.em.fork();

    const productIdRaw = (req.query.product_id ?? req.query.productId) as any;
    const productId = productIdRaw != null && productIdRaw !== '' ? Number(productIdRaw) : undefined;

    const where: any = {};
    if (productId != null && !Number.isNaN(productId)) {
      where.product = productId;
    }

    const data = await em.find(Variant as any, where, {
      populate: ['product'] as any,
      orderBy: { id: 'ASC' } as any,
    } as any);

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener variantes', error });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Variant as any, { id }, { populate: ['product'] as any } as any);
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    res.status(200).json({ message: 'Variante encontrada', data: item });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener variante', error });
  }
}

async function add(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const input = (req.body as any).sanitizedInput || req.body;

    const productId = input.product_id;
    if (!productId) return res.status(400).json({ message: 'product_id es requerido' });

    const product = await em.findOne(Product as any, { id: productId });
    if (!product) return res.status(400).json({ message: 'product_id inválido' });

    const nuevo = em.create(Variant as any, {
      product,
      name: input.name,
      price: input.price,
    });

    await em.flush();
    res.status(201).json({ message: 'Variante creada', data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear variante', error: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Variant as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });

    const input = (req.body as any).sanitizedInput || req.body;

    if (input.product_id != null) {
      const product = await em.findOne(Product as any, { id: input.product_id });
      if (!product) return res.status(400).json({ message: 'product_id inválido' });
      (item as any).product = product;
    }

    em.assign(item, {
      name: input.name,
      price: input.price,
    } as any, { mergeObjects: true } as any);

    await em.flush();
    res.status(200).send({ message: 'Variante actualizada', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al actualizar variante', error });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const id = Number.parseInt(req.params.id);
    const item = await em.findOne(Variant as any, { id });
    if (!item) return res.status(404).send({ message: 'No encontrado' });
    await em.removeAndFlush(item);
    res.status(200).send({ message: 'Variante borrada', data: item });
  } catch (error) {
    res.status(500).send({ message: 'Error al borrar variante', error });
  }
}

export { findAll, findOne, add, update, remove };
