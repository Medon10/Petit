import { Router, type Request, type Response } from 'express';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';
import {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  listSuppliers,
  createSupplier,
} from './expense.service.js';

function handleError(res: Response, error: any, fallback: string) {
  const status = error?.status || 500;
  const message = status === 500 ? fallback : error?.message || fallback;
  if (status === 500) console.error(error);
  return res.status(status).json({ message });
}

export const expenseRouter = Router();
expenseRouter.use(verifyToken, verifyAdmin);

expenseRouter.get('/', async (req: Request, res: Response) => {
  try {
    return res.json(
      await listExpenses({
        from: req.query.from,
        to: req.query.to,
        q: req.query.q,
        page: req.query.page,
        limit: req.query.limit,
      })
    );
  } catch (error) {
    return handleError(res, error, 'Error al obtener gastos');
  }
});

expenseRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await getExpense(Number.parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.json({ data: item });
  } catch (error) {
    return handleError(res, error, 'Error al obtener gasto');
  }
});

expenseRouter.post('/', async (req: Request, res: Response) => {
  try {
    const item = await createExpense(req.body ?? {});
    return res.status(201).json({ message: 'Compra registrada', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al registrar compra');
  }
});

expenseRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const item = await updateExpense(Number.parseInt(req.params.id), req.body ?? {});
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.json({ message: 'Compra actualizada', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al actualizar compra');
  }
});

expenseRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ok = await deleteExpense(Number.parseInt(req.params.id));
    if (!ok) return res.status(404).json({ message: 'No encontrado' });
    return res.json({ message: 'Compra eliminada' });
  } catch (error) {
    return handleError(res, error, 'Error al eliminar compra');
  }
});

export const supplierRouter = Router();
supplierRouter.use(verifyToken, verifyAdmin);

supplierRouter.get('/', async (_req: Request, res: Response) => {
  try {
    return res.json({ data: await listSuppliers() });
  } catch (error) {
    return handleError(res, error, 'Error al obtener proveedores');
  }
});

supplierRouter.post('/', async (req: Request, res: Response) => {
  try {
    const item = await createSupplier((req.body as any)?.name);
    return res.status(201).json({ data: item });
  } catch (error) {
    return handleError(res, error, 'Error al crear proveedor');
  }
});
