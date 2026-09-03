import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import Skeleton from '../../componentes/shared/Skeleton';
import ProductReviews from '../../componentes/shared/ProductReviews';
import { getExtras, getProduct, getProductReviewSummary, toAbsoluteUrl, toResponsiveImage, type ExtraDto, type ProductDetailDto, type ReviewSummaryDto, type VariantDto } from '../../shared/api';
import { useCart } from '../../shared/cart';
import '../Home/Home.css';
import './Product.css';

function formatMoney(price: number) {
  if (!Number.isFinite(price)) return undefined;
  return `$${price.toFixed(2)}`;
}

export default function ProductPage() {
  const params = useParams();
  const productId = Number.parseInt(String(params.id ?? ''), 10);

  const cart = useCart();

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetailDto | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [variantImageById, setVariantImageById] = useState<Record<number, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extras, setExtras] = useState<ExtraDto[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<number>>(new Set());
  const [extrasOpen, setExtrasOpen] = useState(false);
  const extrasRef = useRef<HTMLDivElement | null>(null);
  const [addedToast, setAddedToast] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryDto>({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(productId)) return;
      setLoading(true);
      try {
        const item = await getProduct(productId);
        const [extrasRes, summaryRes] = await Promise.all([
          // Filtramos extras por producto y categoría: solo se muestran los que aplican a este producto.
          getExtras({ productId, categoryId: item?.category?.id }),
          getProductReviewSummary(productId),
        ]);
        if (cancelled) return;
        setProduct(item);
        setExtras(extrasRes);
        setReviewSummary(summaryRes);
        const firstVariantId = (item?.variants || [])[0]?.id;
        setSelectedVariantId(firstVariantId ?? null);
      } catch {
        if (cancelled) return;
        setProduct(null);
        setExtras([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selectedVariant: VariantDto | undefined = useMemo(() => {
    if (!product?.variants?.length) return undefined;
    if (selectedVariantId == null) return product.variants[0];
    return product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  }, [product, selectedVariantId]);

  const priceLabel = useMemo(() => {
    const raw = selectedVariant?.price;
    const n = raw != null ? Number.parseFloat(String(raw)) : NaN;
    return Number.isFinite(n) ? formatMoney(n) : undefined;
  }, [selectedVariant]);

  // Imagen principal del producto — solo de la DB, sin fallback a archivos por convención.
  const img = useMemo(() => {
    if (!Number.isFinite(productId)) return undefined;
    return toAbsoluteUrl(product?.imageUrl) ?? undefined;
  }, [productId, product]);

  // heroSrc es la URL efectiva que se muestra en la imagen grande.
  const heroSrc = selectedImage ?? galleryImages[0] ?? undefined;
  const heroResponsive = useMemo(() => toResponsiveImage(heroSrc), [heroSrc]);

  const categoryId = product?.category?.id;
  const categoryName = product?.category?.name;

  const longDescription = useMemo(() => {
    const cleaned = String(product?.description ?? '').trim();
    if (cleaned) return cleaned;
    return 'Medalla de acero quirúrgico brillo espejo en ambas caras, 1,5 x 2,2cm de diámetro y 1.5mm de espesor. Ideal para un diseño delicado y minimalista. viene con cadena serpentina premium de 45cm o 50cm según stock.';
  }, [product]);

  const visibleExtras = useMemo(() => {
    // Orden: primero servicios, luego dijes, luego el resto.
    const score = (e: ExtraDto) => {
      const t = String((e as any).categoryType ?? '').toLowerCase();
      if (t === 'servicio') return 0;
      if (t === 'dije') return 1;
      return 2;
    };
    return [...extras].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
  }, [extras]);

  const extrasTotal = useMemo(() => {
    let total = 0;
    for (const e of visibleExtras) {
      if (!selectedExtraIds.has(e.id)) continue;
      const n = Number.parseFloat(String(e.price));
      if (Number.isFinite(n)) total += n;
    }
    return total;
  }, [visibleExtras, selectedExtraIds]);

  useEffect(() => {
    if (selectedVariantId == null) return;
    const byVariant = variantImageById[selectedVariantId];
    if (!byVariant) return;
    setSelectedImage(byVariant);
  }, [selectedVariantId, variantImageById]);

  useEffect(() => {
    if (!extrasOpen) return;

    function onPointerDown(e: PointerEvent) {
      const root = extrasRef.current;
      if (!root) return;
      if (root.contains(e.target as Node)) return;
      setExtrasOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [extrasOpen]);

  // Construye la galería a partir de las URLs que vienen de la DB (imagen principal,
  // galleryImages y variant.imageUrl). Se eliminó el fallback legacy que "adivinaba"
  // nombres de archivo por convención (ej: `${productId}-2.jpg`, `${productId}-v${id}.png`):
  // generaba muchos 404 innecesarios y, si alguna URL vieja de testing quedaba en la DB,
  // dificultaba distinguir un 404 esperado de un dato realmente roto. Ahora solo se
  // verifican URLs que efectivamente vienen de la base.
  useEffect(() => {
    let cancelled = false;

    async function buildGallery() {
      if (!Number.isFinite(productId)) return;

      const candidates: string[] = [];
      if (img) candidates.push(img);

      for (const g of product?.galleryImages || []) {
        const absolute = toAbsoluteUrl(g);
        if (absolute) candidates.push(absolute);
      }

      const byVariant: Record<number, string> = {};
      for (const variant of product?.variants || []) {
        const fromDb = toAbsoluteUrl(variant.imageUrl);
        if (fromDb) {
          byVariant[variant.id] = fromDb;
          candidates.push(fromDb);
        }
      }

      // dedupe
      const unique = Array.from(new Set(candidates));
      if (unique.length === 0) {
        if (!cancelled) {
          setGalleryImages([]);
          setVariantImageById({});
          setSelectedImage(null);
          setGalleryLoading(false);
        }
        return;
      }

      setGalleryLoading(true);

      // Verificar cuáles realmente cargan — filtrar las que dan 404/error.
      // Esto es lo que nos protege de URLs viejas/huérfanas que hayan quedado
      // guardadas en la DB (por ejemplo de testing en otro storage).
      const loadedResults = await Promise.all(
        unique.map(
          (u) =>
            new Promise<string | null>((resolve) => {
              const image = new Image();
              image.onload = () => resolve(u);
              image.onerror = () => resolve(null);
              image.src = u;
            })
        )
      );
      const loaded = loadedResults.filter((u): u is string => u !== null);

      // Sacamos del mapa de variantes cualquier URL que no haya cargado.
      for (const variantId of Object.keys(byVariant)) {
        const url = byVariant[Number(variantId)];
        if (!loaded.includes(url)) {
          delete byVariant[Number(variantId)];
        }
      }

      if (cancelled) return;

      const finalList = Array.from(new Set(loaded)).filter(Boolean);
      setGalleryImages(finalList);
      setVariantImageById(byVariant);
      setSelectedImage((prev) => {
        if (prev && finalList.includes(prev)) return prev;
        const selectedVariantImage = selectedVariantId != null ? byVariant[selectedVariantId] : undefined;
        if (selectedVariantImage) return selectedVariantImage;
        return finalList[0] ?? null;
      });
      setGalleryLoading(false);
    }

    buildGallery();
    return () => {
      cancelled = true;
    };
  }, [productId, img, product?.galleryImages, product?.variants, selectedVariantId]);

  return (
    <div className="petit-product">
      <Helmet>
        <title>{product?.name ? `${product.name} | Petit Accesorios` : 'Producto | Petit Accesorios'}</title>
        <meta name="description" content={product?.description || 'Detalle de producto en Petit Accesorios.'} />
        <link rel="canonical" href={`https://petitaccesorios.com.ar/productos/${productId}`} />
        <meta property="og:title" content={product?.name ? `${product.name} | Petit Accesorios` : 'Producto | Petit Accesorios'} />
        <meta property="og:description" content={product?.description || 'Detalle de producto en Petit Accesorios.'} />
        <meta property="og:url" content={`https://petitaccesorios.com.ar/productos/${productId}`} />
        {img ? <meta property="og:image" content={img} /> : null}
        <meta name="twitter:title" content={product?.name || 'Producto | Petit Accesorios'} />
        <meta name="twitter:description" content={product?.description || 'Detalle de producto en Petit Accesorios.'} />
        {product ? (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description || undefined,
            "image": img || undefined,
            "url": `https://petitaccesorios.com.ar/productos/${productId}`,
            "brand": { "@type": "Brand", "name": "Petit Accesorios" },
            ...(selectedVariant?.price ? {
              "offers": {
                "@type": "Offer",
                "price": parseFloat(String(selectedVariant.price)),
                "priceCurrency": "ARS",
                "availability": "https://schema.org/InStock",
                "url": `https://petitaccesorios.com.ar/productos/${productId}`
              }
            } : {}),
            ...(categoryName ? {
              "category": categoryName
            } : {}),
            ...(reviewSummary.totalReviews > 0 ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": String(reviewSummary.averageRating),
                "reviewCount": String(reviewSummary.totalReviews)
              }
            } : {})
          })}</script>
        ) : null}
      </Helmet>
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Detalle del producto">
        <div className="ph-container">
          <div className="ph-breadcrumbs">
            <Link className="ph-crumb" to="/">Inicio</Link>
            {categoryId ? (
              <>
                <span className="ph-crumbSep">/</span>
                <Link className="ph-crumb" to={`/categorias/${categoryId}`}>{categoryName ?? 'Categoría'}</Link>
              </>
            ) : null}
          </div>

          {loading ? (
            <div className="ph-productLayout" aria-label="Cargando producto">
              <div className="ph-productLeft">
                <Skeleton variant="image" height={380} />
              </div>
              <div className="ph-productRight" style={{ display: 'grid', gap: 12 }}>
                <Skeleton variant="text" width="72%" />
                <Skeleton variant="text" width="36%" />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="95%" />
                <Skeleton variant="text" width="90%" />
              </div>
            </div>
          ) : !Number.isFinite(productId) ? (
            <p className="ph-empty">Producto inválido.</p>
          ) : !product ? (
            <p className="ph-empty">No encontramos este producto.</p>
          ) : (
            <div className="ph-productLayout">
              <div className="ph-productLeft">
                <div className="ph-productHero">
                  {heroSrc ? (
                    <img
                      key={heroSrc}
                      className="ph-productHeroImg"
                      src={heroResponsive.src ?? heroSrc}
                      srcSet={heroResponsive.srcSet}
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      alt={product.name}
                      onError={() => {
                        // Red de seguridad: si una URL que ya habíamos "verificado" igual
                        // falla al renderizar (caché stale, CDN caído momentáneamente, etc.),
                        // la sacamos de la galería en vez de dejarla como hero/miniatura rota.
                        setGalleryImages((prev) => prev.filter((u) => u !== heroSrc));
                        setSelectedImage(null);
                      }}
                    />
                  ) : galleryLoading ? (
                    <Skeleton variant="image" height={380} />
                  ) : null}
                </div>

                {galleryImages.length > 1 ? (
                  <div className="ph-thumbs" aria-label="Galería de imágenes">
                    {galleryImages.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={u === heroSrc ? 'ph-thumb isActive' : 'ph-thumb'}
                        onClick={() => setSelectedImage(u)}
                        aria-label="Ver imagen"
                      >
                        <img
                          className="ph-thumbImg"
                          src={u}
                          alt=""
                          loading="lazy"
                          onError={() => {
                            setGalleryImages((prev) => prev.filter((img2) => img2 !== u));
                          }}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="ph-productRight">
                <h2 className="ph-h2 ph-productTitle">{product.name}</h2>
                {priceLabel ? <p className="ph-productPrice">{priceLabel}</p> : null}


                {product.variants?.length ? (
                  <div className="ph-field">
                    <label className="ph-label" htmlFor="variant">
                      Variante
                    </label>
                    <select
                      id="variant"
                      className="ph-select"
                      value={selectedVariant?.id ?? ''}
                      onChange={(e) => setSelectedVariantId(Number.parseInt(e.target.value, 10))}
                    >
                      {product.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="ph-actionsRow">
                  <button
                    type="button"
                    className="ph-primaryButton"
                    onClick={() => {
                      if (!Number.isFinite(productId)) return;
                      cart.addItem({
                        productId,
                        variantId: selectedVariant?.id ?? null,
                        extraIds: Array.from(selectedExtraIds.values()),
                        quantity: 1,
                      });
                      cart.openCart();
                      setAddedToast(true);
                      window.setTimeout(() => setAddedToast(false), 1600);
                    }}
                  >
                    Agregar al carrito
                  </button>

                  {addedToast ? <span className="ph-addedToast">Agregado</span> : null}

                  {categoryId ? (
                    <Link className="ph-secondaryLink" to={`/categorias/${categoryId}`}>
                      Ver más de esta categoría
                    </Link>
                  ) : null}
                </div>

                <p className="ph-productLongDesc">{longDescription}</p>

                <p className="ph-whatsappCoordination">
                  Algunas elecciones de grabado o diseño final las podés coordinar por WhatsApp al enviar el comprobante.
                </p>

                {visibleExtras.length > 0 ? (
                  <div className="ph-extras" aria-label="Extras">
                    <h3 className="ph-extrasTitle">Extras</h3>
                    <div className="ph-extrasDropdown" ref={extrasRef}>
                      <button
                        type="button"
                        className="ph-extrasTrigger"
                        aria-haspopup="menu"
                        aria-expanded={extrasOpen}
                        onClick={() => setExtrasOpen((v) => !v)}
                      >
                        {selectedExtraIds.size ? `Extras seleccionados: ${selectedExtraIds.size}` : 'Seleccionar extras'}
                        <span className="ph-extrasTriggerMeta">
                          {extrasTotal > 0 ? `+ $${extrasTotal.toLocaleString('es-AR')}` : ''}
                        </span>
                        <span className="material-symbols-outlined ph-extrasChevron" aria-hidden="true">
                          expand_more
                        </span>
                      </button>

                      <div className={extrasOpen ? 'ph-extrasMenu isOpen' : 'ph-extrasMenu'} role="menu">
                        <div className="ph-extrasList" role="presentation">
                          {visibleExtras.map((e) => {
                            const checked = selectedExtraIds.has(e.id);
                            const n = Number.parseFloat(String(e.price));
                            const labelPrice = Number.isFinite(n) ? `$${n.toLocaleString('es-AR')}` : String(e.price);
                            return (
                              <label key={e.id} className="ph-extraItem" role="menuitemcheckbox" aria-checked={checked}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setSelectedExtraIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(e.id)) next.delete(e.id);
                                      else next.add(e.id);
                                      return next;
                                    });
                                  }}
                                />
                                <span className="ph-extraName">{e.name}</span>
                                <span className="ph-extraPrice">{labelPrice}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {extrasTotal > 0 ? (
                      <p className="ph-extrasSummary">Extras seleccionados: ${extrasTotal.toLocaleString('es-AR')}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      {product && Number.isFinite(productId) ? (
        <section className="ph-section" aria-label="Opiniones del producto">
          <div className="ph-container">
            <ProductReviews productId={productId} />
          </div>
        </section>
      ) : null}

      {product && Number.isFinite(productId) ? (
        <div className="ph-mobileStickyCta" aria-label="Acción rápida de compra">
          <div className="ph-mobileStickyMeta">
            <span className="ph-mobileStickyName">{product.name}</span>
            <span className="ph-mobileStickyPrice">{priceLabel || 'Consultar precio'}</span>
          </div>
          <button
            type="button"
            className="ph-mobileStickyBtn"
            onClick={() => {
              cart.addItem({
                productId,
                variantId: selectedVariant?.id ?? null,
                extraIds: Array.from(selectedExtraIds.values()),
                quantity: 1,
              });
              cart.openCart();
            }}
          >
            Agregar
          </button>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}