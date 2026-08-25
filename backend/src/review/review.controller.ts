import { Request, Response } from 'express';
import { createReview, getApprovedReviews, getReviewSummary } from './review.service.js';

export async function submitReview(req: Request, res: Response) {
  try {
    const result = await createReview(req.body);

    // Honeypot was triggered — return fake success
    if ((result as any).honeypot) {
      return res.status(201).json({ message: 'Reseña enviada', data: { id: 0 } });
    }

    return res.status(201).json({ message: 'Reseña enviada. Será publicada luego de ser revisada.', data: result });
  } catch (error: any) {
    const status = error?.status || 400;
    return res.status(status).json({ message: error?.message || 'Error al enviar reseña', code: error?.code });
  }
}

export async function listProductReviews(req: Request, res: Response) {
  try {
    const productId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(productId)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }
    const result = await getApprovedReviews(productId, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener reseñas', error });
  }
}

export async function getProductReviewSummary(req: Request, res: Response) {
  try {
    const productId = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(productId)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }
    const result = await getReviewSummary(productId);
    return res.json({ data: result });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener resumen de reseñas', error });
  }
}
