import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getProductReviews,
  getProductReviewSummary,
  submitReview,
  type ReviewDto,
  type ReviewSummaryDto,
} from '../../shared/api';
import './ProductReviews.css';

// ── Helpers ─────────────────────────────────────────────────

function renderStars(count: number) {
  return Array.from({ length: 5 }, (_, i) => (i < count ? '★' : '☆')).join('');
}

function formatDate(raw?: string) {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

// ── StarPicker ──────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="pr-starPicker" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= value;
        const isHovered = hovered > 0 && star <= hovered && star > value;
        return (
          <button
            key={star}
            type="button"
            className={`pr-starBtn${isActive ? ' isActive' : ''}${isHovered ? ' isHovered' : ''}`}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

export default function ProductReviews({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [summary, setSummary] = useState<ReviewSummaryDto>({ averageRating: 0, totalReviews: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const loadReviews = useCallback(async (p: number) => {
    if (!Number.isFinite(productId)) return;
    setLoading(true);
    try {
      const [reviewsRes, summaryRes] = await Promise.all([
        getProductReviews(productId, { page: p, limit: 10 }),
        p === 1 ? getProductReviewSummary(productId) : Promise.resolve(null),
      ]);
      setReviews(reviewsRes.data);
      setTotalPages(reviewsRes.totalPages);
      if (summaryRes) setSummary(summaryRes);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews(1);
  }, [loadReviews]);

  function handlePageChange(newPage: number) {
    setPage(newPage);
    loadReviews(newPage);
  }

  async function handleSubmit() {
    setFormError('');

    const trimmedName = name.trim();
    if (!trimmedName) { setFormError('Ingresá tu nombre.'); return; }
    if (rating < 1 || rating > 5) { setFormError('Seleccioná una puntuación.'); return; }
    if (comment.length > 1000) { setFormError('El comentario no puede superar los 1000 caracteres.'); return; }

    setSubmitting(true);
    try {
      await submitReview({
        product_id: productId,
        customer_name: trimmedName,
        rating,
        comment: comment.trim() || undefined,
        website: honeypot || undefined,
      });
      setFormSuccess(true);
      setName('');
      setRating(0);
      setComment('');
      setHoneypot('');
      // Reload summary to update count (if it was auto-approved in the future)
      try {
        const s = await getProductReviewSummary(productId);
        setSummary(s);
      } catch { /* ignore */ }
    } catch (e: any) {
      setFormError(e?.message || 'No se pudo enviar la reseña. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const summaryStars = useMemo(() => {
    const rounded = Math.round(summary.averageRating);
    return renderStars(rounded);
  }, [summary.averageRating]);

  if (!Number.isFinite(productId)) return null;

  return (
    <div className="pr-reviews" aria-label="Reseñas del producto">
      {/* ── Header ── */}
      <div className="pr-reviewsHeader">
        <h3 className="pr-reviewsTitle">Opiniones</h3>
        {summary.totalReviews > 0 ? (
          <span className="pr-summaryBadge">
            <span className="pr-summaryStars" aria-hidden="true">{summaryStars}</span>
            <span className="pr-summaryAvg">{summary.averageRating.toFixed(1)}</span>
            <span className="pr-summaryCount">
              ({summary.totalReviews} {summary.totalReviews === 1 ? 'opinión' : 'opiniones'})
            </span>
          </span>
        ) : null}
      </div>

      {/* ── Reviews list ── */}
      {loading && reviews.length === 0 ? (
        <p className="pr-emptyReviews">Cargando opiniones...</p>
      ) : reviews.length === 0 ? (
        <p className="pr-emptyReviews">Todavía no hay opiniones. ¡Sé el primero en compartir la tuya!</p>
      ) : (
        <>
          <div className="pr-reviewsList">
            {reviews.map((r) => (
              <article key={r.id} className="pr-reviewCard">
                <div className="pr-reviewTop">
                  <span className="pr-reviewAuthor">{r.customerName}</span>
                  <span className="pr-reviewDate">{formatDate(r.createdAt)}</span>
                </div>
                <div className="pr-reviewStars" aria-label={`${r.rating} de 5 estrellas`}>
                  {renderStars(r.rating)}
                </div>
                {r.comment ? <p className="pr-reviewComment">{r.comment}</p> : null}
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="pr-pagination">
              <button
                type="button"
                className="pr-pageBtn"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                ← Anterior
              </button>
              <button
                type="button"
                className="pr-pageBtn"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Siguiente →
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* ── Form ── */}
      {formSuccess ? (
        <div className="pr-formSuccess">
          ¡Gracias por tu opinión! Será publicada luego de ser revisada.
        </div>
      ) : (
        <div className="pr-formWrap">
          <h4 className="pr-formTitle">Dejá tu opinión</h4>
          <div className="pr-formGrid">
            <div className="pr-field">
              <label className="pr-fieldLabel" htmlFor="pr-name">Nombre</label>
              <input
                id="pr-name"
                className="pr-fieldInput"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                maxLength={100}
              />
            </div>

            <div className="pr-field">
              <span className="pr-fieldLabel">Puntuación</span>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            <div className="pr-field">
              <label className="pr-fieldLabel" htmlFor="pr-comment">Comentario (opcional)</label>
              <textarea
                id="pr-comment"
                className="pr-fieldTextarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contanos tu experiencia..."
                maxLength={1000}
                rows={3}
              />
              <span className="pr-charCount">{comment.length}/1000</span>
            </div>

            {/* Honeypot */}
            <div className="pr-hp" aria-hidden="true">
              <label htmlFor="pr-website">Website</label>
              <input
                id="pr-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {formError ? <p className="pr-formError">{formError}</p> : null}

            <button
              type="button"
              className="pr-submitBtn"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Enviando...' : 'Enviar opinión'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
