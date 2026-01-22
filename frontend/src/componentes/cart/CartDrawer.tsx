import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getExtras, getProduct, toAbsoluteUrl, type ExtraDto, type ProductDetailDto } from '../../shared/api';
import { useCart } from '../../shared/cart';
import './CartDrawer.css';

function moneyAr(amount: number) {
  if (!Number.isFinite(amount)) return '$0';
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}

function parsePrice(p: unknown) {
  const n = Number.parseFloat(String(p ?? ''));
  return Number.isFinite(n) ? n : 0;
}

export default function CartDrawer() {
  const cart = useCart();
  const location = useLocation();
  const [productsById, setProductsById] = useState<Record<number, ProductDetailDto>>({});
  const [extrasById, setExtrasById] = useState<Record<number, ExtraDto>>({});

  useEffect(() => {
    if (!cart.isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') cart.closeCart();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cart]);

  useEffect(() => {
    if (!cart.isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cart.isOpen]);

  useEffect(() => {
    if (!cart.isOpen) return;
    // Si navega a otra ruta, cerramos el drawer para no “quedar flotando”.
    cart.closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cart.isOpen) return;
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
  }, [cart.isOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (!cart.isOpen) return;
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
  }, [cart.isOpen, cart.items]);

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

  return (
    <div className={cart.isOpen ? 'ph-cartDrawerRoot isOpen' : 'ph-cartDrawerRoot'} aria-hidden={!cart.isOpen}>
      <div className="ph-cartDrawerOverlay" onClick={() => cart.closeCart()} />
      <aside className="ph-cartDrawer" role="dialog" aria-modal="true" aria-label="Mi carrito" onClick={(e) => e.stopPropagation()}>
        <header className="ph-cartDrawerHeader">
          <h3 className="ph-cartDrawerTitle">Mi carrito</h3>
          <button type="button" className="ph-cartDrawerClose" aria-label="Cerrar" onClick={() => cart.closeCart()}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <div className="ph-cartDrawerBody">
          {cart.items.length === 0 ? (
            <div className="ph-cartDrawerEmpty">
              <p className="ph-empty">Tu carrito está vacío.</p>
              <Link className="ph-secondaryLink" to="/" onClick={() => cart.closeCart()}>
                Ver productos
              </Link>
            </div>
          ) : (
            <>
              <div className="ph-cartDrawerList" aria-label="Productos en carrito">
                {cart.items.map((it) => {
                  const product = productsById[it.productId];
                  const variant = product?.variants?.find((v) => v.id === it.variantId) ?? product?.variants?.[0];
                  const img = toAbsoluteUrl(product?.imageUrl) ?? toAbsoluteUrl(`/images/products/${it.productId}.jpg`);

                  const lineVariantPrice = parsePrice(variant?.price);
                  const lineExtrasPrice = it.extraIds.reduce((sum, id) => sum + parsePrice(extrasById[id]?.price), 0);
                  const lineTotal = (lineVariantPrice + lineExtrasPrice) * it.quantity;

                  return (
                    <div key={it.key} className="ph-cartDrawerItem">
                      <Link className="ph-cartDrawerMedia" to={`/productos/${it.productId}`} onClick={() => cart.closeCart()}>
                        <img className="ph-cartDrawerImg" src={img} alt={product?.name ?? 'Producto'} loading="lazy" />
                      </Link>

                      <div className="ph-cartDrawerInfo">
                        <div className="ph-cartDrawerTopRow">
                          <Link className="ph-cartDrawerName" to={`/productos/${it.productId}`} onClick={() => cart.closeCart()}>
                            {product?.name ?? `Producto #${it.productId}`}
                            {variant?.name ? <span className="ph-cartDrawerVariant">({variant.name})</span> : null}
                          </Link>

                          <button
                            type="button"
                            className="ph-cartDrawerTrash"
                            aria-label="Quitar"
                            onClick={() => cart.removeItem(it.key)}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                          </button>
                        </div>

                        <div className="ph-cartDrawerBottomRow">
                          <div className="ph-cartDrawerQty" aria-label="Cantidad">
                            <button
                              type="button"
                              className="ph-cartDrawerQtyBtn"
                              aria-label="Restar"
                              onClick={() => cart.setQuantity(it.key, Math.max(1, it.quantity - 1))}
                            >
                              −
                            </button>
                            <span className="ph-cartDrawerQtyValue">{it.quantity}</span>
                            <button
                              type="button"
                              className="ph-cartDrawerQtyBtn"
                              aria-label="Sumar"
                              onClick={() => cart.setQuantity(it.key, it.quantity + 1)}
                            >
                              +
                            </button>
                          </div>

                          <div className="ph-cartDrawerLineTotal">{moneyAr(lineTotal)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ph-cartDrawerSummary" aria-label="Resumen">
                <div className="ph-cartDrawerSummaryRow">
                  <span>Subtotal (sin envío)</span>
                  <strong>{moneyAr(summary.subtotal)}</strong>
                </div>

                <div className="ph-cartDrawerCtas">
                  <Link className="ph-primaryButton ph-primaryLink" to="/checkout" onClick={() => cart.closeCart()}>
                    Finalizar compra
                  </Link>
                  <Link className="ph-secondaryButton" to="/carrito" onClick={() => cart.closeCart()}>
                    Ver carrito
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
