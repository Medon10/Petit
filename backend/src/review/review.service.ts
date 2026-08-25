import { orm } from '../shared/bdd/orm.js';
import { Review, ReviewStatus } from './review.entity.js';
import { Product } from '../product/product.entity.js';

// ── Helpers ─────────────────────────────────────────────────

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function inputError(code: string, message: string) {
  const err = new Error(message) as Error & { code?: string; status?: number };
  err.code = code;
  err.status = 400;
  return err;
}

// ── Public ──────────────────────────────────────────────────

export type CreateReviewInput = {
  product_id?: number;
  customer_name?: string;
  rating?: number;
  comment?: string;
  /** Honeypot field — should be empty */
  website?: string;
};

export async function createReview(input: CreateReviewInput) {
  // Honeypot: if filled, silently ignore (return fake success)
  if (input.website && String(input.website).trim().length > 0) {
    return { honeypot: true };
  }

  const productId = Number(input.product_id);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw inputError('product_id_required', 'product_id es requerido');
  }

  const customerName = toTrimmedString(input.customer_name);
  if (!customerName) {
    throw inputError('customer_name_required', 'El nombre es requerido');
  }
  if (customerName.length > 100) {
    throw inputError('customer_name_too_long', 'El nombre no puede superar los 100 caracteres');
  }

  const rating = Number(input.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || Math.floor(rating) !== rating) {
    throw inputError('rating_invalid', 'La puntuación debe ser un número entero entre 1 y 5');
  }

  const comment = toTrimmedString(input.comment);
  if (comment.length > 1000) {
    throw inputError('comment_too_long', 'El comentario no puede superar los 1000 caracteres');
  }

  const em = orm.em.fork();

  // Verify product exists
  const product = await em.findOne(Product as any, { id: productId } as any);
  if (!product) {
    throw inputError('product_not_found', 'Producto no encontrado');
  }

  const review = em.create(Review as any, {
    product,
    customerName,
    rating,
    comment: comment || undefined,
    status: ReviewStatus.PENDING,
  });

  await em.persistAndFlush(review);

  return {
    id: (review as any).id,
    productId,
    customerName,
    rating,
    comment: comment || undefined,
    status: ReviewStatus.PENDING,
    createdAt: (review as any).createdAt,
  };
}

export async function getApprovedReviews(productId: number, params?: { page?: unknown; limit?: unknown }) {
  const em = orm.em.fork();

  const limitRaw = params?.limit as any;
  const limit = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 20;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), 50) : 20;

  const pageRaw = params?.page as any;
  const page = pageRaw != null && String(pageRaw).trim() !== '' ? Number(pageRaw) : 1;
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;

  const offset = (safePage - 1) * safeLimit;

  const [data, total] = await em.findAndCount(
    Review as any,
    { product: productId, status: ReviewStatus.APPROVED } as any,
    {
      orderBy: { createdAt: 'DESC' } as any,
      limit: safeLimit,
      offset,
    } as any,
  );

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    data: (data as any[]).map((r) => ({
      id: r.id,
      productId,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      createdAt: r.createdAt,
    })),
    total,
    page: safePage,
    totalPages,
  };
}

export async function getReviewSummary(productId: number) {
  const em = orm.em.fork();

  const reviews = await em.find(
    Review as any,
    { product: productId, status: ReviewStatus.APPROVED } as any,
    { fields: ['rating'] as any },
  );

  const total = reviews.length;
  if (total === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const sum = (reviews as any[]).reduce((acc, r) => acc + Number(r.rating), 0);
  const avg = Math.round((sum / total) * 10) / 10; // 1 decimal

  return { averageRating: avg, totalReviews: total };
}

// ── Admin ───────────────────────────────────────────────────

export async function listAllReviews(params: {
  status?: unknown;
  productId?: unknown;
  page?: unknown;
  limit?: unknown;
  q?: unknown;
}) {
  const em = orm.em.fork();

  const limitRaw = params.limit as any;
  const limit = limitRaw != null && String(limitRaw).trim() !== '' ? Number(limitRaw) : 50;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(1, limit), 200) : 50;

  const pageRaw = params.page as any;
  const page = pageRaw != null && String(pageRaw).trim() !== '' ? Number(pageRaw) : 1;
  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;

  const where: any = {};

  const status = String(params.status ?? '').trim();
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    where.status = status;
  }

  const productIdRaw = Number(params.productId);
  if (Number.isFinite(productIdRaw) && productIdRaw > 0) {
    where.product = productIdRaw;
  }

  const q = String(params.q ?? '').trim();
  if (q) {
    where.$or = [
      { customerName: { $ilike: `%${q}%` } },
      { comment: { $ilike: `%${q}%` } },
    ];
  }

  const offset = (safePage - 1) * safeLimit;

  const [data, total] = await em.findAndCount(Review as any, where, {
    orderBy: { id: 'DESC' } as any,
    limit: safeLimit,
    offset,
    populate: ['product'] as any,
  } as any);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    data: (data as any[]).map((r) => ({
      id: r.id,
      productId: r.product?.id ?? null,
      productName: r.product?.name ?? null,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      createdAt: r.createdAt,
    })),
    total,
    page: safePage,
    totalPages,
  };
}

const VALID_REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;

export async function setReviewStatus(id: number, status: string) {
  if (!VALID_REVIEW_STATUSES.includes(status as any)) {
    throw new Error(`Estado inválido: ${status}. Valores válidos: ${VALID_REVIEW_STATUSES.join(', ')}`);
  }
  const em = orm.em.fork();
  const review = await em.findOne(Review as any, { id } as any);
  if (!review) return null;
  (review as any).status = status;
  await em.flush();
  return {
    id: (review as any).id,
    productId: (review as any).product?.id,
    customerName: (review as any).customerName,
    rating: (review as any).rating,
    comment: (review as any).comment,
    status: (review as any).status,
    createdAt: (review as any).createdAt,
  };
}

export async function deleteReview(id: number) {
  const em = orm.em.fork();
  const review = await em.findOne(Review as any, { id } as any);
  if (!review) return null;
  await em.removeAndFlush(review);
  return { id };
}
