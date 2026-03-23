import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import Skeleton from '../../componentes/shared/Skeleton';
import { createOrder, getExtras, getProduct, type ExtraDto, type ProductDetailDto } from '../../shared/api';
import { useCart } from '../../shared/cart';
import '../Home/Home.css';
import './Checkout.css';

type OrderConfirmationItem = {
  key: string;
  name: string;
  quantity: number;
  total: number;
};

type OrderConfirmationState = {
  orderNumber: string;
  total: number;
  items: OrderConfirmationItem[];
};

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

  const canSubmit = cart.items.length > 0 && invalidItems.length === 0 && !submitting;

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

    setSubmitting(true);
    try {
      const orderItemsSummary: OrderConfirmationItem[] = cart.items.map((it) => {
        const product = productsById[it.productId];
        const variant = product?.variants?.find((v) => v.id === it.variantId) ?? product?.variants?.[0];
        const lineVariantPrice = parsePrice(variant?.price);
        const lineExtrasPrice = it.extraIds.reduce((sum, id) => sum + parsePrice(extrasById[id]?.price), 0);
        const lineTotal = (lineVariantPrice + lineExtrasPrice) * it.quantity;
        const variantName = variant?.name ? ` (${variant.name})` : '';

        return {
          key: it.key,
          name: `${product?.name ?? `Producto #${it.productId}`}${variantName}`,
          quantity: it.quantity,
          total: lineTotal,
        };
      });

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
      const idRaw = (res as any)?.data?.id;
      const idNum = Number(idRaw);
      const orderNumber = Number.isFinite(idNum) ? String(idNum) : String(idRaw ?? 'ok');

      const orderState: OrderConfirmationState = {
        orderNumber,
        total: summary.subtotal,
        items: orderItemsSummary,
      };

      cart.clear();
      nav(`/pedido/${orderNumber}`, { state: orderState });
    } catch (e: any) {
      setError(e?.message || 'No se pudo crear el pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout-page">
      <Helmet>
        <title>Checkout | Petit Accesorios</title>
        <meta name="description" content="Confirmá tus datos y finalizá tu pedido en Petit Accesorios." />
      </Helmet>
      <Header />

      <main className="checkout-main" aria-label="Checkout">
        <div className="checkout-shell">
          <header className="checkout-hero">
            <h1>Finaliza tu compra</h1>
            <nav aria-label="Breadcrumb">
              <span>Carrito</span>
              <span className="checkout-separator">/</span>
              <span className="is-current">Checkout</span>
            </nav>
          </header>

          {cart.items.length === 0 ? (
            <section className="checkout-empty" aria-live="polite">
              <p>Tu carrito esta vacio.</p>
              <Link className="checkout-link" to="/">Volver al catalogo</Link>
            </section>
          ) : (
            <div className="checkout-grid">
              <section className="checkout-formPanel">
                <div className="checkout-sectionTitle">
                  <span className="checkout-line" />
                  <h2>Datos del comprador</h2>
                </div>

                <div className="checkout-formGrid">
                  <label className="checkout-field">
                    Nombre completo
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ej: Elena Rossi" />
                  </label>

                  <label className="checkout-field">
                    Correo electronico
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="nombre@email.com"
                    />
                  </label>

                  <label className="checkout-field checkout-fieldFull">
                    Telefono
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+54 9..." />
                  </label>

                  <label className="checkout-field checkout-fieldFull">
                    Notas adicionales
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Cualquier detalle que debamos tener en cuenta..."
                    />
                  </label>
                </div>

                <section className="checkout-pickupBox" aria-label="Informacion de retiro">
                  <div className="checkout-pickupIcon" aria-hidden="true">
                    RETIRO
                  </div>
                  <div>
                    <h3>Retiro por coordinacion</h3>
                    <p>
                      Te contactamos por WhatsApp luego de confirmar la compra para definir direccion exacta, horario y detalles de
                      entrega.
                    </p>
                  </div>
                </section>

                <section className="checkout-noteBox" aria-label="Nota de personalizacion">
                  <h4>Personalizacion</h4>
                  <p>
                    Los detalles de grabado, tipografia y ubicacion se coordinan por WhatsApp al enviar el comprobante.
                  </p>
                </section>

                {error ? <p className="checkout-error">{error}</p> : null}
                {invalidItems.length ? (
                  <p className="checkout-error">Hay {invalidItems.length} item(s) sin variante. Volve al carrito para corregirlos.</p>
                ) : null}

                <div className="checkout-actions">
                  <button type="button" className="checkout-submit" disabled={!canSubmit} onClick={onSubmit}>
                    {submitting ? 'Enviando...' : 'Confirmar compra'}
                  </button>

                  <Link className="checkout-link" to="/carrito">
                    Volver al carrito
                  </Link>
                </div>
              </section>

              <aside className="checkout-summaryPanel" aria-label="Resumen del pedido">
                <h3>Resumen del pedido</h3>

                <div className="checkout-summaryRows">
                  <div className="checkout-summaryRow">
                    <span>Productos</span>
                    <strong>{cart.totalItems}</strong>
                  </div>
                  <div className="checkout-summaryRow">
                    <span>Subtotal</span>
                    <strong>{moneyAr(summary.subtotal)}</strong>
                  </div>
                </div>

                <div className="checkout-items">
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
                    const title = `${product?.name ?? `Producto #${it.productId}`}${variant?.name ? ` (${variant.name})` : ''}`;
                    return (
                      <article key={it.key} className="checkout-item">
                        <div className="checkout-thumb" aria-hidden="true">
                          {(product?.name ?? 'P').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="checkout-itemContent">
                          <h4>{title}</h4>
                          {extrasNames ? <p>Extras: {extrasNames}</p> : null}
                          <div className="checkout-itemRow">
                            <span>x{it.quantity}</span>
                            <strong>{moneyAr(lineTotal)}</strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {loadingSummary ? (
                  <div className="checkout-loading" aria-label="Cargando resumen">
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="70%" />
                  </div>
                ) : null}

                <p className="checkout-secureText">Transaccion segura. Pedido generado en estado pending.</p>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

