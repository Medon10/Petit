import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import { createOrder, getExtras, getProduct, type ExtraDto, type ProductDetailDto } from '../../shared/api';
import { useCart } from '../../shared/cart';
import '../Home/Home.css';
import './styles.css';

function parsePrice(p: unknown) {
  const n = Number.parseFloat(String(p ?? ''));
  return Number.isFinite(n) ? n : 0;
}

function moneyAr(amount: number) {
  if (!Number.isFinite(amount)) return '$0';
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}

export default function CheckoutPage() {
  const cart = useCart();
  const nav = useNavigate();

  const [productsById, setProductsById] = useState<Record<number, ProductDetailDto>>({});
  const [extrasById, setExtrasById] = useState<Record<number, ExtraDto>>({});
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidItems = useMemo(() => {
    return cart.items.filter((it) => it.variantId == null);
  }, [cart.items]);

  useEffect(() => {
    let cancelled = false;
    async function loadExtras() {
      try {
        const extras = await getExtras();
        if (cancelled) return;
        const map: Record<number, ExtraDto> = {};
        for (const e of extras) map[e.id] = e;
        setExtrasById(map);
      } catch {
        if (cancelled) return;
        setExtrasById({});
      }
    }
    loadExtras();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      const ids = Array.from(new Set(cart.items.map((i) => i.productId)));
      if (ids.length === 0) {
        setProductsById({});
        return;
      }
      setLoadingSummary(true);
      try {
        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const p = await getProduct(id);
              return p ? ({ id, product: p } as const) : null;
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        const map: Record<number, ProductDetailDto> = {};
        for (const e of entries) {
          if (!e) continue;
          map[e.id] = e.product;
        }
        setProductsById(map);
      } finally {
        if (cancelled) return;
        setLoadingSummary(false);
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [cart.items]);

  const summary = useMemo(() => {
    let subtotal = 0;
    for (const it of cart.items) {
      const product = productsById[it.productId];
      const variant = product?.variants?.find((v) => v.id === it.variantId) ?? product?.variants?.[0];
      const variantPrice = parsePrice(variant?.price);
      const extrasPrice = it.extraIds.reduce((sum, id) => sum + parsePrice(extrasById[id]?.price), 0);
      subtotal += (variantPrice + extrasPrice) * it.quantity;
    }
    return { subtotal };
  }, [cart.items, productsById, extrasById]);

  const canSubmit = cart.items.length > 0 && invalidItems.length === 0 && customerName.trim().length > 1 && !submitting;

  async function onSubmit() {
    setError(null);

    if (cart.items.length === 0) {
      setError('El carrito está vacío.');
      return;
    }

    if (invalidItems.length) {
      setError('Hay productos sin variante seleccionada. Volvé al producto y elegí una variante.');
      return;
    }

    const name = customerName.trim();
    if (!name) {
      setError('Nombre y apellido es requerido.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_name: name,
        customer_email: customerEmail.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        items: cart.items.map((it) => ({
          product_id: it.productId,
          variant_id: it.variantId as number,
          quantity: it.quantity,
          extras: (it.extraIds || []).map((extraId) => ({ extra_id: extraId, quantity: 1 })),
        })),
      };

      const res = await createOrder(payload);
      const id = Number((res as any)?.data?.id);
      cart.clear();
      if (Number.isFinite(id)) {
        nav(`/pedido/${id}`);
      } else {
        nav(`/pedido/ok`);
      }
    } catch (e: any) {
      setError(e?.message || 'No se pudo crear el pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="petit-checkout">
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Checkout">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Checkout</h2>
            <div className="ph-divider" />
          </div>

          {cart.items.length === 0 ? (
            <div className="ph-checkoutEmpty">
              <p className="ph-empty">Tu carrito está vacío.</p>
              <Link className="ph-secondaryLink" to="/">Volver al catálogo</Link>
            </div>
          ) : (
            <div className="ph-checkoutLayout">
              <div className="ph-checkoutForm">
                <h3 className="ph-checkoutTitle">Datos del comprador</h3>

                <label className="ph-label">
                  Nombre y apellido
                  <input className="ph-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </label>

                <label className="ph-label">
                  Email (opcional)
                  <input className="ph-input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </label>

                <label className="ph-label">
                  Teléfono (opcional)
                  <input className="ph-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </label>

                <label className="ph-label">
                  Notas (opcional)
                  <textarea className="ph-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </label>

                {error ? <p className="ph-error">{error}</p> : null}

                <button type="button" className="ph-primaryButton" disabled={!canSubmit} onClick={onSubmit}>
                  {submitting ? 'Enviando…' : 'Confirmar pedido'}
                </button>

                <Link className="ph-secondaryLink" to="/carrito">
                  Volver al carrito
                </Link>
              </div>

              <aside className="ph-checkoutSummary" aria-label="Resumen">
                <div className="ph-cartSummaryBox">
                  <div className="ph-cartSummaryRow">
                    <span>Productos</span>
                    <strong>{cart.totalItems}</strong>
                  </div>
                  <div className="ph-cartSummaryRow">
                    <span>Subtotal</span>
                    <strong>{moneyAr(summary.subtotal)}</strong>
                  </div>
                  <div className="ph-checkoutItems">
                    {cart.items.map((it) => {
                      const product = productsById[it.productId];
                      const variant = product?.variants?.find((v) => v.id === it.variantId) ?? product?.variants?.[0];
                      const lineVariantPrice = parsePrice(variant?.price);
                      const lineExtrasPrice = it.extraIds.reduce((sum, id) => sum + parsePrice(extrasById[id]?.price), 0);
                      const lineTotal = (lineVariantPrice + lineExtrasPrice) * it.quantity;
                      const extrasNames = it.extraIds
                        .map((id) => extrasById[id]?.name)
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <div key={it.key} className="ph-checkoutItem">
                          <div className="ph-checkoutItemName">
                            {(product?.name ?? `Producto #${it.productId}`)} {variant?.name ? `(${variant.name})` : ''}
                          </div>
                          {extrasNames ? <div className="ph-checkoutItemMeta">Extras: {extrasNames}</div> : null}
                          <div className="ph-checkoutItemRow">
                            <span>x{it.quantity}</span>
                            <strong>{moneyAr(lineTotal)}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {invalidItems.length ? (
                    <p className="ph-error">Hay {invalidItems.length} ítem(s) sin variante.</p>
                  ) : null}
                  {loadingSummary ? <p className="ph-cartNote">Cargando resumen…</p> : null}
                  <p className="ph-cartNote">Este checkout crea el pedido en el backend (estado: pending).</p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
