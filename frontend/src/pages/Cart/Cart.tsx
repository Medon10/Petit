import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import { getExtras, getProduct, toAbsoluteUrl, type ExtraDto, type ProductDetailDto } from '../../shared/api';
import { useCart } from '../../shared/cart';
import '../Home/Home.css';
import './Cart.css';

function hasItemsWithoutVariant(items: Array<{ variantId: number | null }>) {
  return items.some((item) => item.variantId == null);
}

function moneyAr(amount: number) {
  if (!Number.isFinite(amount)) return '$0';
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}

function parsePrice(p: unknown) {
  const n = Number.parseFloat(String(p ?? ''));
  return Number.isFinite(n) ? n : 0;
}

export default function CartPage() {
  const cart = useCart();
  const [productsById, setProductsById] = useState<Record<number, ProductDetailDto>>({});
  const [extrasById, setExtrasById] = useState<Record<number, ExtraDto>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
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

    load();
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

  const hasInvalidVariants = hasItemsWithoutVariant(cart.items);
  const shippingMethod = cart.shipping.method;
  const total = summary.subtotal;
  const canProceedToCheckout = cart.items.length > 0 && !hasInvalidVariants;

  return (
    <div className="petit-cart">
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Carrito">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Carrito</h2>
            <div className="ph-divider" />
          </div>

          {cart.items.length === 0 ? (
            <div className="ph-cartEmpty">
              <p className="ph-empty">Tu carrito está vacío.</p>
              <Link className="ph-secondaryLink" to="/">Ver productos</Link>
            </div>
          ) : (
            <div className="ph-cartLayout">
              <div className="ph-cartList">
                {cart.items.map((it) => {
                  const product = productsById[it.productId];
                  const variant = product?.variants?.find((v) => v.id === it.variantId) ?? product?.variants?.[0];
                  const img = toAbsoluteUrl(product?.imageUrl) ?? toAbsoluteUrl(`/images/products/${it.productId}.jpg`);
                  const extrasNames = it.extraIds
                    .map((id) => extrasById[id]?.name)
                    .filter(Boolean)
                    .join(' · ');

                  const lineVariantPrice = parsePrice(variant?.price);
                  const lineExtrasPrice = it.extraIds.reduce((sum, id) => sum + parsePrice(extrasById[id]?.price), 0);
                  const lineTotal = (lineVariantPrice + lineExtrasPrice) * it.quantity;

                  return (
                    <div key={it.key} className="ph-cartItem">
                      <Link className="ph-cartMedia" to={`/productos/${it.productId}`}>
                        <img className="ph-cartImg" src={img} alt={product?.name ?? 'Producto'} loading="lazy" />
                      </Link>

                      <div className="ph-cartInfo">
                        <Link className="ph-cartName" to={`/productos/${it.productId}`}>
                          {product?.name ?? `Producto #${it.productId}`}
                        </Link>
                        {variant?.name ? <div className="ph-cartMeta">Variante: {variant.name}</div> : null}
                        {extrasNames ? <div className="ph-cartMeta">Extras: {extrasNames}</div> : null}

                        <div className="ph-cartControls">
                          <label className="ph-cartQty">
                            Cant.
                            <input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) => cart.setQuantity(it.key, Number.parseInt(e.target.value || '1', 10))}
                            />
                          </label>

                          <button type="button" className="ph-cartRemove" onClick={() => cart.removeItem(it.key)}>
                            Quitar
                          </button>

                          <div className="ph-cartLineTotal">{moneyAr(lineTotal)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="ph-cartSummary" aria-label="Resumen">
                <div className="ph-cartSummaryBox">
                  <div className="ph-cartShipBlock" aria-label="Metodo de entrega">
                    <h3 className="ph-cartShipTitle">Entrega</h3>
                    <div className="ph-cartShipMethods">
                      <label className="ph-cartShipOption">
                        <input
                          type="radio"
                          name="cart-shipping-method"
                          checked={shippingMethod === 'pickup'}
                          onChange={() => cart.setShippingMethod('pickup')}
                        />
                        Retiro coordinado
                      </label>
                      <label className="ph-cartShipOption">
                        <input
                          type="radio"
                          name="cart-shipping-method"
                          checked={shippingMethod === 'delivery'}
                          onChange={() => cart.setShippingMethod('delivery')}
                        />
                        Envio a domicilio
                      </label>
                    </div>

                    {shippingMethod === 'delivery' ? (
                      <div className="ph-cartShipFields">
                        <p className="ph-cartShipMeta">El envío se coordina por WhatsApp al finalizar la compra.</p>
                      </div>
                    ) : (
                      <p className="ph-cartShipMeta">Retiro sin costo. También podés coordinar envío por WhatsApp en checkout.</p>
                    )}
                  </div>

                  <div className="ph-cartSummaryRow">
                    <span>Subtotal</span>
                    <strong>{moneyAr(summary.subtotal)}</strong>
                  </div>

                  <div className="ph-cartSummaryRow">
                    <span>Envio</span>
                    <strong>{shippingMethod === 'delivery' ? 'A coordinar por WhatsApp' : 'Retiro'}</strong>
                  </div>

                  <div className="ph-cartSummaryRow isTotal">
                    <span>Total</span>
                    <strong>{moneyAr(total)}</strong>
                  </div>

                  <p className="ph-cartNote">En checkout confirmamos direccion completa y coordinamos el envio por WhatsApp antes de generar el pedido.</p>

                  <Link
                    className={`ph-primaryButton ph-primaryLink${canProceedToCheckout ? '' : ' isDisabled'}`}
                    to="/checkout"
                    aria-disabled={!canProceedToCheckout}
                    onClick={(e) => {
                      if (!canProceedToCheckout) e.preventDefault();
                    }}
                  >
                    Ir al checkout
                  </Link>

                  <button type="button" className="ph-cartClear" onClick={() => cart.clear()}>
                    Vaciar carrito
                  </button>
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

