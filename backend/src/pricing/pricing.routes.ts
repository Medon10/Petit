import { Router, type Request, type Response } from 'express';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';
import { listPricing, updateVariantPricing, batchUpdateCosts } from './pricing.service.js';

function handleError(res: Response, error: any, fallback: string) {
  const status = error?.status || 500;
  const message = status === 500 ? fallback : error?.message || fallback;
  if (status === 500) console.error(error);
  return res.status(status).json({ message });
}

export const pricingRouter = Router();
pricingRouter.use(verifyToken, verifyAdmin);

pricingRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await listPricing({
      category_id: req.query.category_id,
      q: req.query.q,
    });
    return res.json(data);
  } catch (error) {
    return handleError(res, error, 'Error al obtener precios y márgenes');
  }
});

pricingRouter.put('/:variantId', async (req: Request, res: Response) => {
  try {
    const variantId = Number.parseInt(req.params.variantId);
    const item = await updateVariantPricing(variantId, req.body ?? {});
    return res.json({ message: 'Costos actualizados', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al actualizar costos');
  }
});

pricingRouter.post('/batch', async (req: Request, res: Response) => {
  try {
    const result = await batchUpdateCosts(req.body ?? {});
    return res.json(result);
  } catch (error) {
    return handleError(res, error, 'Error en actualización masiva de costos');
  }
});
