import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import { getExtras, getProduct, toAbsoluteUrl, type ExtraDto, type ProductDetailDto, type VariantDto } from '../../shared/api';
import { useCart } from '../../shared/cart';
import '../Home/Home.css';
import './styles.css';

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
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extras, setExtras] = useState<ExtraDto[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<number>>(new Set());
  const [extrasOpen, setExtrasOpen] = useState(false);
  const extrasRef = useRef<HTMLDivElement | null>(null);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(productId)) return;
      setLoading(true);
      try {
        const [item, extrasRes] = await Promise.all([
          getProduct(productId),
          // Por ahora traemos todos; más adelante podemos filtrar por category_type o por producto.
          getExtras(),
        ]);
        if (cancelled) return;
        setProduct(item);
        setExtras(extrasRes);
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

  const img = useMemo(() => {
    if (!Number.isFinite(productId)) return undefined;
    const fromDb = toAbsoluteUrl(product?.imageUrl);
    return fromDb ?? toAbsoluteUrl(`/images/products/${productId}.jpg`);
  }, [productId, product]);

  const categoryId = product?.category?.id;
  const categoryName = product?.category?.name;

  const longDescription = useMemo(() => {
    const cleaned = String(product?.description ?? '').trim();
    if (cleaned) return cleaned;
    return 'Medalla de acero quirúrgico brillo espejo en ambas caras, 1,5 x 2,2cm de diámetro y 1.5mm de espesor. Ideal para un diseño delicado y minimalista. viene con cadena serpentina premium de 45cm o 50cm según stock.';
  }, [product]);

  const fallbackExtras: ExtraDto[] = useMemo(() => {
    // Fallback si todavía no cargaste extras en la DB.
    return [
      { id: -1, name: 'Grabado extra (reverso)', price: '3000.00', categoryType: 'servicio' },
      { id: -2, name: 'Dijes adicionales (con grabado)', price: '3600.00', categoryType: 'dije' },
    ];
  }, []);

  const visibleExtras = useMemo(() => {
    const list = extras.length ? extras : fallbackExtras;
    // Orden: primero servicios, luego dijes, luego el resto.
    const score = (e: ExtraDto) => {
      const t = String((e as any).categoryType ?? '').toLowerCase();
      if (t === 'servicio') return 0;
      if (t === 'dije') return 1;
      return 2;
    };
    return [...list].sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
  }, [extras, fallbackExtras]);

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

  // Construye la galería: imagen principal + intenta variantes por convención /images/products/{id}-{n}.(jpg|jpeg|png)
  useEffect(() => {
    let cancelled = false;

    async function buildGallery() {
      if (!Number.isFinite(productId)) return;

      const candidates: string[] = [];
      if (img) candidates.push(img);

      const extensions = ['jpg', 'jpeg', 'png'];
      for (let i = 2; i <= 6; i += 1) {
        for (const ext of extensions) {
          const url = toAbsoluteUrl(`/images/products/${productId}-${i}.${ext}`);
          if (url) candidates.push(url);
        }
      }

      // dedupe
      const unique = Array.from(new Set(candidates));
      if (unique.length === 0) return;

      const loaded: string[] = [];
      await Promise.all(
        unique.map(
          (u) =>
            new Promise<void>((resolve) => {
              const image = new Image();
              image.onload = () => {
                loaded.push(u);
                resolve();
              };
              image.onerror = () => resolve();
              image.src = u;
            })
        )
      );

      if (cancelled) return;
      const finalList = loaded.length ? loaded : (img ? [img] : []);
      setGalleryImages(finalList);
      setSelectedImage((prev) => {
        if (prev && finalList.includes(prev)) return prev;
        return finalList[0] ?? null;
      });
    }

    buildGallery();
    return () => {
      cancelled = true;
    };
  }, [productId, img]);

  return (
    <div className="petit-product">
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Detalle del producto">
        <div className="ph-container">
          <div className="ph-breadcrumbs">
            <Link className="ph-crumb" to="/">Inicio</Link>
            <span className="ph-crumbSep">/</span>
            <Link className="ph-crumb" to="/categorias">Categorías</Link>
            {categoryId ? (
              <>
                <span className="ph-crumbSep">/</span>
                <Link className="ph-crumb" to={`/categorias/${categoryId}`}>{categoryName ?? 'Categoría'}</Link>
              </>
            ) : null}
          </div>

          {loading ? (
            <p className="ph-empty">Cargando producto...</p>
          ) : !Number.isFinite(productId) ? (
            <p className="ph-empty">Producto inválido.</p>
          ) : !product ? (
            <p className="ph-empty">No encontramos este producto.</p>
          ) : (
            <div className="ph-productLayout">
              <div className="ph-productLeft">
                <div className="ph-productHero">
                  {selectedImage ? <img className="ph-productHeroImg" src={selectedImage} alt={product.name} /> : null}
                </div>

                {galleryImages.length > 1 ? (
                  <div className="ph-thumbs" aria-label="Galería de imágenes">
                    {galleryImages.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={u === selectedImage ? 'ph-thumb isActive' : 'ph-thumb'}
                        onClick={() => setSelectedImage(u)}
                        aria-label="Ver imagen"
                      >
                        <img className="ph-thumbImg" src={u} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="ph-productRight">
                <h2 className="ph-h2 ph-productTitle">{product.name}</h2>
                {priceLabel ? <p className="ph-productPrice">{priceLabel}</p> : null}

                {product.description ? <p className="ph-productDesc">{product.description}</p> : null}

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
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
