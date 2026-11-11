import { Router, type Request, type Response } from 'express';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';
import {
  listSupplies,
  getSupply,
  createSupply,
  updateSupply,
  deleteSupply,
  adjustSupplyStock,
  getSupplyMovements,
  getVariantComponent,
  setVariantComponent,
  listAllVariantComponents,
} from './supply.service.js';

function handleError(res: Response, error: any, fallback: string) {
  const status = error?.status || 500;
  const message = status === 500 ? fallback : error?.message || fallback;
  if (status === 500) console.error(error);
  return res.status(status).json({ message });
}

export const supplyRouter = Router();
supplyRouter.use(verifyToken, verifyAdmin);

supplyRouter.get('/', async (req: Request, res: Response) => {
  try {
    return res.json(
      await listSupplies({
        q: req.query.q,
        low_stock_only: req.query.low_stock_only ?? req.query.lowStockOnly,
        page: req.query.page,
        limit: req.query.limit,
      })
    );
  } catch (error) {
    return handleError(res, error, 'Error al obtener piezas de inventario');
  }
});

supplyRouter.post('/', async (req: Request, res: Response) => {
  try {
    const item = await createSupply(req.body ?? {});
    return res.status(201).json({ message: 'Pieza creada', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al crear pieza');
  }
});

supplyRouter.get('/mappings', async (_req: Request, res: Response) => {
  try {
    return res.json({ data: await listAllVariantComponents() });
  } catch (error) {
    return handleError(res, error, 'Error al obtener mapeos de variantes');
  }
});

supplyRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await getSupply(id);
    if (!item) return res.status(404).json({ message: 'Pieza no encontrada' });
    return res.json({ data: item });
  } catch (error) {
    return handleError(res, error, 'Error al obtener pieza');
  }
});

supplyRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await updateSupply(id, req.body ?? {});
    if (!item) return res.status(404).json({ message: 'Pieza no encontrada' });
    return res.json({ message: 'Pieza actualizada', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al actualizar pieza');
  }
});

supplyRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await deleteSupply(id);
    if (!item) return res.status(404).json({ message: 'Pieza no encontrada' });
    return res.json({ message: 'Pieza eliminada', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al eliminar pieza');
  }
});

supplyRouter.post('/:id/adjust', async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await adjustSupplyStock(id, req.body ?? {});
    if (!item) return res.status(404).json({ message: 'Pieza no encontrada' });
    return res.json({ message: 'Stock actualizado', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al ajustar stock');
  }
});

supplyRouter.get('/:id/movements', async (req: Request, res: Response) => {
  try {
    const id = Number.parseInt(req.params.id);
    const item = await getSupplyMovements(id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.json(item);
  } catch (error) {
    return handleError(res, error, 'Error al obtener movimientos');
  }
});

// ── Rutas para variantes ────────────────────────────────────

export const variantComponentRouter = Router();
variantComponentRouter.use(verifyToken, verifyAdmin);

variantComponentRouter.get('/:variantId', async (req: Request, res: Response) => {
  try {
    const variantId = Number.parseInt(req.params.variantId);
    const item = await getVariantComponent(variantId);
    return res.json({ data: item });
  } catch (error) {
    return handleError(res, error, 'Error al obtener componente');
  }
});

variantComponentRouter.put('/:variantId', async (req: Request, res: Response) => {
  try {
    const variantId = Number.parseInt(req.params.variantId);
    const supplyId = req.body?.supply_id !== undefined ? (req.body.supply_id ? Number(req.body.supply_id) : null) : null;
    const quantity = req.body?.quantity ? Number(req.body.quantity) : 1;
    const item = await setVariantComponent(variantId, supplyId, quantity);
    return res.json({ message: 'Vinculación actualizada', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al vincular componente');
  }
});
