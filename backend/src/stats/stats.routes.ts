import { Router, type Request, type Response } from 'express';
import { verifyToken } from '../shared/middleware/verifytoken.js';
import { verifyAdmin } from '../shared/middleware/verifyAdmin.js';
import { getSummary, getMonthly, getExpensesBreakdown, getTop } from './stats.service.js';

function handleError(res: Response, error: any, fallback: string) {
  const status = error?.status || 500;
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? fallback : error?.message || fallback });
}

export const statsRouter = Router();
statsRouter.use(verifyToken, verifyAdmin);

statsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    return res.json(await getSummary({ from: req.query.from, to: req.query.to }));
  } catch (error) {
    return handleError(res, error, 'Error al calcular resumen');
  }
});

statsRouter.get('/monthly', async (req: Request, res: Response) => {
  try {
    return res.json(await getMonthly({ year: req.query.year }));
  } catch (error) {
    return handleError(res, error, 'Error al calcular evolución mensual');
  }
});

statsRouter.get('/expenses-breakdown', async (req: Request, res: Response) => {
  try {
    return res.json(await getExpensesBreakdown({ from: req.query.from, to: req.query.to }));
  } catch (error) {
    return handleError(res, error, 'Error al calcular desglose de gastos');
  }
});

statsRouter.get('/top', async (req: Request, res: Response) => {
  try {
    return res.json(await getTop({ from: req.query.from, to: req.query.to }));
  } catch (error) {
    return handleError(res, error, 'Error al calcular ranking');
  }
});
