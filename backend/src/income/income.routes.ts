import { Router, type Request, type Response } from 'express';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';
import { listIncomes, createIncome, updateIncome, deleteIncome } from './income.service.js';

function handleError(res: Response, error: any, fallback: string) {
  const status = error?.status || 500;
  const message = status === 500 ? fallback : error?.message || fallback;
  if (status === 500) console.error(error);
  return res.status(status).json({ message });
}

export const incomeRouter = Router();
incomeRouter.use(verifyToken, verifyAdmin);

incomeRouter.get('/', async (req: Request, res: Response) => {
  try {
    return res.json(
      await listIncomes({ from: req.query.from, to: req.query.to, q: req.query.q, limit: req.query.limit })
    );
  } catch (error) {
    return handleError(res, error, 'Error al obtener ingresos');
  }
});

incomeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const item = await createIncome(req.body ?? {});
    return res.status(201).json({ message: 'Ingreso registrado', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al registrar ingreso');
  }
});

incomeRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const item = await updateIncome(Number.parseInt(req.params.id), req.body ?? {});
    if (!item) return res.status(404).json({ message: 'No encontrado' });
    return res.json({ message: 'Ingreso actualizado', data: item });
  } catch (error) {
    return handleError(res, error, 'Error al actualizar ingreso');
  }
});

incomeRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ok = await deleteIncome(Number.parseInt(req.params.id));
    if (!ok) return res.status(404).json({ message: 'No encontrado' });
    return res.json({ message: 'Ingreso eliminado' });
  } catch (error) {
    return handleError(res, error, 'Error al eliminar ingreso');
  }
});
