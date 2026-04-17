import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import Skeleton from '../../componentes/shared/Skeleton';
import {
  createOrder,
  getExtras,
  getProduct,
  quoteShipping,
  type ExtraDto,
  type ProductDetailDto,
  type ShippingQuoteDto,
} from '../../shared/api';
import { useCart } from '../../shared/cart';
import {
  buildShippingQuoteItems,
  buildShippingQuoteKey,
  formatQuoteExpiration,
  formatShippingEta,
  isPostalCodeValid,
  isShippingQuoteExpired,
  normalizePostalCode,
} from '../../shared/shipping';
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
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingMethod: 'pickup' | 'delivery';
  shippingProvider?: string;
  shippingService?: string;
  shippingPostalCode?: string;
  shippingEta?: string;
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
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidItems = useMemo(() => {
    return cart.items.filter((it) => it.variantId == null);
  }, [cart.items]);

  const shippingMethod = cart.shipping.method;
  const shippingPostalCode = cart.shipping.postalCode;
  const shippingQuote = cart.shipping.quote;
  const shippingQuoteExpired = isShippingQuoteExpired(shippingQuote);
  const shippingPostalCodeValid = isPostalCodeValid(shippingPostalCode);
  const quoteItems = useMemo(() => buildShippingQuoteItems(cart.items), [cart.items]);
  const quoteRequestKey = useMemo(() => buildShippingQuoteKey(shippingPostalCode, quoteItems), [shippingPostalCode, quoteItems]);
  const shippingCost = shippingMethod === 'delivery' && shippingQuote && !shippingQuoteExpired ? Number(shippingQuote.cost) : 0;

  const shippingAddressLine1 = cart.shipping.addressLine1.trim();
  const shippingCity = cart.shipping.city.trim();
  const shippingProvince = cart.shipping.province.trim();
  const shippingAddressReady =
    shippingMethod === 'pickup' || (shippingAddressLine1.length > 0 && shippingCity.length > 0 && shippingProvince.length > 0);

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

  async function recalculateShippingQuote(options?: { showLoading?: boolean; isCancelled?: () => boolean }) {
    const showLoading = options?.showLoading ?? true;
    const isCancelled = options?.isCancelled ?? (() => false);

    if (shippingMethod !== 'delivery') return null;
    if (cart.items.length === 0 || invalidItems.length > 0) return null;
    if (!shippingPostalCodeValid) return null;

    if (showLoading) setShippingQuoteLoading(true);
    setShippingQuoteError(null);

    try {
      const quote = await quoteShipping({
        postal_code: normalizePostalCode(shippingPostalCode),
        items: quoteItems,
      });

      if (isCancelled()) return null;

      if (!quote) {
        cart.clearShippingQuote();
        setShippingQuoteError('No se pudo obtener una cotizacion para ese codigo postal.');
        return null;
      }

      cart.setShippingQuote(quote);
      setShippingQuoteError(null);
      return quote;
    } catch (e: any) {
      if (isCancelled()) return null;
      cart.clearShippingQuote();
      setShippingQuoteError(e?.message || 'No pudimos cotizar el envio. Intenta nuevamente.');
      return null;
    } finally {
      if (showLoading && !isCancelled()) setShippingQuoteLoading(false);
    }
  }

  useEffect(() => {
    if (shippingMethod !== 'delivery') {
      setShippingQuoteLoading(false);
      setShippingQuoteError(null);
      return;
    }

    if (cart.items.length === 0) {
      cart.clearShippingQuote();
      setShippingQuoteLoading(false);
      setShippingQuoteError(null);
      return;
    }

    if (invalidItems.length > 0) {
      cart.clearShippingQuote();
      setShippingQuoteLoading(false);
      setShippingQuoteError('Hay productos sin variante seleccionada. Corregilos para cotizar envio.');
      return;
    }

    if (!shippingPostalCodeValid) {
      cart.clearShippingQuote();
      setShippingQuoteLoading(false);
      setShippingQuoteError(shippingPostalCode ? 'Codigo postal invalido. Usa 4 a 8 caracteres.' : null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void recalculateShippingQuote({ showLoading: true, isCancelled: () => cancelled });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [shippingMethod, shippingPostalCode, shippingPostalCodeValid, quoteRequestKey, invalidItems.length, cart.items.length]);

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

  const total = summary.subtotal + shippingCost;

  const canSubmit =
    cart.items.length > 0 &&
    invalidItems.length === 0 &&
    !submitting &&
    !shippingQuoteLoading &&
    shippingAddressReady &&
    (shippingMethod === 'pickup' || (!!shippingQuote && !shippingQuoteExpired));

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

    if (shippingMethod === 'delivery') {
      if (!shippingPostalCodeValid) {
        setError('Codigo postal invalido.');
        return;
      }
      if (!shippingAddressLine1 || !shippingCity || !shippingProvince) {
        setError('Completa direccion, localidad y provincia para continuar con envio.');
        return;
      }
    }

    const name = customerName.trim();
    if (!name) {
      setError('Ingresa tu nombre completo para confirmar el pedido.');
      return;
    }

    setSubmitting(true);
    try {
      let activeQuote: ShippingQuoteDto | null = shippingQuote;

      if (shippingMethod === 'delivery') {
        const quotePostalMatches =
          !!activeQuote && normalizePostalCode(activeQuote.postalCode) === normalizePostalCode(shippingPostalCode);

        if (!activeQuote || shippingQuoteExpired || !quotePostalMatches) {
          const refreshed = await recalculateShippingQuote({ showLoading: true });
          if (refreshed) {
            setError(`La cotizacion de envio se actualizo a ${moneyAr(Number(refreshed.cost))}. Revisa el total y confirma nuevamente.`);
          } else {
            setError('No se pudo actualizar la cotizacion de envio. Revisa tus datos e intenta otra vez.');
          }
          return;
        }
      }

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
        shipping:
          shippingMethod === 'delivery'
            ? {
                method: 'delivery' as const,
                postal_code: normalizePostalCode(shippingPostalCode),
                quote_id: activeQuote?.quoteId,
                address_line1: shippingAddressLine1,
                address_line2: cart.shipping.addressLine2.trim() || undefined,
                city: shippingCity,
                province: shippingProvince,
              }
            : {
                method: 'pickup' as const,
              },
        items: cart.items.map((it) => ({
          product_id: it.productId,
          variant_id: it.variantId as number,
          quantity: it.quantity,
          extras: (it.extraIds || []).map((extraId) => ({ extra_id: extraId, quantity: 1 })),
        })),
      };

      const res = await createOrder(payload);
      const createdOrder = (res as any)?.data;
      const idRaw = createdOrder?.id;
      const idNum = Number(idRaw);
      const orderNumber = Number.isFinite(idNum) ? String(idNum) : String(idRaw ?? 'ok');

      const subtotal = Number(createdOrder?.subtotal ?? summary.subtotal);
      const createdShippingCost = Number(createdOrder?.shippingCost ?? shippingCost);
      const createdTotal = Number(createdOrder?.total ?? subtotal + createdShippingCost);

      const etaFromQuote = shippingMethod === 'delivery' ? formatShippingEta(activeQuote) : undefined;

      const orderState: OrderConfirmationState = {
        orderNumber,
        subtotal: Number.isFinite(subtotal) ? subtotal : summary.subtotal,
        shippingCost: Number.isFinite(createdShippingCost) ? createdShippingCost : shippingCost,
        total: Number.isFinite(createdTotal) ? createdTotal : total,
        shippingMethod,
        shippingProvider: createdOrder?.shippingProvider ?? activeQuote?.provider,
        shippingService: createdOrder?.shippingService ?? activeQuote?.service,
        shippingPostalCode: createdOrder?.shippingPostalCode ?? normalizePostalCode(shippingPostalCode),
        shippingEta: createdOrder?.shippingEtaMinDays
          ? `${createdOrder.shippingEtaMinDays} a ${createdOrder.shippingEtaMaxDays} dias`
          : etaFromQuote,
        items: orderItemsSummary,
      };

      cart.clear();
      nav(`/pedido/${orderNumber}`, { state: orderState });
    } catch (e: any) {
      const code = String(e?.code ?? '');
      if (shippingMethod === 'delivery' && code.startsWith('shipping_quote')) {
        const refreshed = await recalculateShippingQuote({ showLoading: true });
        if (refreshed) {
          setError(`La cotizacion de envio cambio y se actualizo a ${moneyAr(Number(refreshed.cost))}. Revisa el total y confirma nuevamente.`);
        } else {
          setError(e?.message || 'No se pudo validar la cotizacion de envio.');
        }
        return;
      }
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

                <section className="checkout-deliveryBox" aria-label="Metodo de entrega">
                  <h3>Metodo de entrega</h3>

                  <div className="checkout-deliveryMethods">
                    <label className="checkout-deliveryOption">
                      <input
                        type="radio"
                        name="checkout-shipping-method"
                        checked={shippingMethod === 'pickup'}
                        onChange={() => cart.setShippingMethod('pickup')}
                      />
                      Retiro coordinado
                    </label>

                    <label className="checkout-deliveryOption">
                      <input
                        type="radio"
                        name="checkout-shipping-method"
                        checked={shippingMethod === 'delivery'}
                        onChange={() => cart.setShippingMethod('delivery')}
                      />
                      Envio a domicilio
                    </label>
                  </div>

                  {shippingMethod === 'delivery' ? (
                    <div className="checkout-deliveryGrid">
                      <label className="checkout-field">
                        Codigo postal
                        <input
                          value={shippingPostalCode}
                          onChange={(e) => cart.setShippingPostalCode(e.target.value)}
                          placeholder="Ej: 5000"
                          inputMode="numeric"
                        />
                      </label>

                      <div className="checkout-deliveryActions">
                        <button
                          type="button"
                          className="checkout-requoteBtn"
                          onClick={() => {
                            void recalculateShippingQuote({ showLoading: true });
                          }}
                          disabled={shippingQuoteLoading || invalidItems.length > 0 || !shippingPostalCodeValid}
                        >
                          {shippingQuoteLoading ? 'Cotizando...' : 'Recotizar envio'}
                        </button>
                      </div>

                      <label className="checkout-field checkout-fieldFull">
                        Calle y numero
                        <input
                          value={cart.shipping.addressLine1}
                          onChange={(e) => cart.setShippingAddress({ addressLine1: e.target.value })}
                          placeholder="Ej: Av. Siempre Viva 742"
                        />
                      </label>

                      <label className="checkout-field checkout-fieldFull">
                        Depto / Piso (opcional)
                        <input
                          value={cart.shipping.addressLine2}
                          onChange={(e) => cart.setShippingAddress({ addressLine2: e.target.value })}
                          placeholder="Ej: Piso 3, Depto B"
                        />
                      </label>

                      <label className="checkout-field">
                        Localidad
                        <input
                          value={cart.shipping.city}
                          onChange={(e) => cart.setShippingAddress({ city: e.target.value })}
                          placeholder="Ej: Cordoba"
                        />
                      </label>

                      <label className="checkout-field">
                        Provincia
                        <input
                          value={cart.shipping.province}
                          onChange={(e) => cart.setShippingAddress({ province: e.target.value })}
                          placeholder="Ej: Cordoba"
                        />
                      </label>

                      {shippingQuote && !shippingQuoteExpired ? (
                        <div className="checkout-quoteBox" aria-live="polite">
                          <p>
                            {shippingQuote.provider} · {shippingQuote.service}
                          </p>
                          <p>
                            Entrega estimada: {formatShippingEta(shippingQuote)} · Vence {formatQuoteExpiration(shippingQuote.expiresAt)}
                          </p>
                          <strong>{moneyAr(Number(shippingQuote.cost))}</strong>
                        </div>
                      ) : null}

                      {shippingQuote && shippingQuoteExpired ? (
                        <p className="checkout-error">La cotizacion de envio vencio. Recotiza antes de confirmar.</p>
                      ) : null}

                      {shippingQuoteError ? <p className="checkout-error">{shippingQuoteError}</p> : null}
                    </div>
                  ) : (
                    <p className="checkout-deliveryHint">
                      Retiro por coordinacion. Te contactamos por WhatsApp para definir direccion y horario.
                    </p>
                  )}
                </section>

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
                  <div className="checkout-summaryRow">
                    <span>Envio</span>
                    <strong>{shippingMethod === 'delivery' ? (shippingQuote && !shippingQuoteExpired ? moneyAr(shippingCost) : 'Por cotizar') : 'Retiro'}</strong>
                  </div>
                  <div className="checkout-summaryRow is-total">
                    <span>Total</span>
                    <strong>{moneyAr(total)}</strong>
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

                <p className="checkout-secureText">Antes de confirmar validamos cotizacion de envio y generamos el pedido en estado pending.</p>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

