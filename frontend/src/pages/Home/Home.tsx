import { useEffect, useMemo, useRef, useState } from 'react';
import './Home.css';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import { Link } from 'react-router-dom';
import {
  getCategories,
  getProducts,
  toAbsoluteUrl,
  type CategoryDto,
  type ProductDto,
} from '../../shared/api';

function categoryImageUrl(categoryId: number) {
  // Convención: backend/public/images/categories/{id}.jpg
  return toAbsoluteUrl(`/images/categories/${categoryId}.jpg`);
}

function formatMoney(price: number) {
  if (!Number.isFinite(price)) return undefined;
  return `$${price.toFixed(2)}`;
}

export default function HomePage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [cats, prods] = await Promise.all([
          getCategories({ includeRepresentative: true }),
          getProducts({ limit: 8 }),
        ]);

        if (cancelled) return;
        setCategories(cats);
        setProducts(prods);
      } catch {
        if (cancelled) return;
        setCategories([]);
        setProducts([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const collections = useMemo(() => {
    return categories.map((c) => {
      const rep = toAbsoluteUrl(c.representativeImageUrl);
      return {
        id: c.id,
        title: c.name,
        subtitle: 'Ver diseños',
        image: rep ?? categoryImageUrl(c.id),
      };
    });
  }, [categories]);

  return (
    <div className="petit-home">
      <Header />

      <section className="ph-hero" aria-label="Banner principal">
        <div className="ph-heroImage" />
      </section>

      <section className="ph-section" aria-label="Colecciones">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Colecciones</h2>
            <div className="ph-divider" />
          </div>

          <div className="ph-carouselWrap" aria-label="Carrusel de categorías">
            <button
              type="button"
              className="ph-carouselArrow ph-carouselArrowLeft"
              aria-label="Mover categorías a la izquierda"
              onClick={() => carouselRef.current?.scrollBy({ left: -420, behavior: 'smooth' })}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <div className="ph-carousel" ref={carouselRef}>
              <div className="ph-carouselTrack">
                {collections.map((c) => (
                  <Link key={c.id} className="ph-collectionCard ph-carouselItem" to={`/categorias/${c.id}`}>
                    <div className="ph-collectionMedia">
                      <img className="ph-collectionImg" src={c.image} alt={c.title} loading="lazy" />
                    </div>
                    <div className="ph-collectionText">
                      <h3 className="ph-h3">{c.title}</h3>
                      <span className="ph-smallLink">{c.subtitle}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="ph-carouselArrow ph-carouselArrowRight"
              aria-label="Mover categorías a la derecha"
              onClick={() => carouselRef.current?.scrollBy({ left: 420, behavior: 'smooth' })}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      <section className="ph-section ph-sectionTopBorder" aria-label="Productos">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Productos</h2>
            <div className="ph-divider" />
          </div>

          <div className="ph-gridProducts">
            {products.map((p) => {
              const img = toAbsoluteUrl(p.imageUrl) ?? toAbsoluteUrl(`/images/products/${p.id}.jpg`);
              const prices = (p.variants || [])
                .map((v) => Number.parseFloat(String(v.price)))
                .filter((n) => Number.isFinite(n));
              const min = prices.length ? Math.min(...prices) : undefined;
              const priceLabel = min != null ? formatMoney(min) : undefined;

              return (
              <Link key={p.id} className="ph-productCard" to={`/productos/${p.id}`}>
                <div className="ph-productMedia">
                  <img className="ph-productImg" src={img} alt={p.name} loading="lazy" />
                  <div className="ph-productCTA" aria-hidden="true">
                    <span className="material-symbols-outlined">shopping_bag</span>
                  </div>
                </div>
                <div className="ph-productText">
                  <h3 className="ph-productName">{p.name}</h3>
                  {priceLabel ? <p className="ph-price">{priceLabel}</p> : null}
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
