import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import Pagination from '../../componentes/shared/Pagination';
import Skeleton from '../../componentes/shared/Skeleton';
import { searchProductsPage, toAbsoluteUrl, toResponsiveImage, type ProductDto } from '../../shared/api';
import '../Home/Home.css';
import './Search.css';

function formatMoney(price: number) {
  if (!Number.isFinite(price)) return undefined;
  return `$${price.toFixed(2)}`;
}

function useQueryParam(name: string) {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get(name) || '';
  }, [location.search, name]);
}

export default function SearchPage() {
  const query = useQueryParam('q').trim();
  const [items, setItems] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!query) {
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        return;
      }

      setLoading(true);
      try {
        const result = await searchProductsPage(query, { page, limit: 12 });
        if (cancelled) return;
        setItems(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages || 1);
      } catch {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, page]);

  return (
    <div className="petit-search">
      <Helmet>
        <title>{query ? `Buscar: ${query} | Petit Accesorios` : 'Búsqueda | Petit Accesorios'}</title>
        <meta name="description" content={query ? `Resultados de búsqueda para ${query} en Petit Accesorios.` : 'Buscá productos en Petit Accesorios.'} />
      </Helmet>

      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Resultados de búsqueda">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Resultados de búsqueda</h2>
            <div className="ph-divider" />
          </div>

          {!query ? (
            <p className="ph-empty">Escribí un término para buscar productos.</p>
          ) : (
            <>
              <p className="ph-searchSummary">{total} resultado(s) para "{query}"</p>

              {loading ? (
                <div className="ph-gridProducts" aria-label="Cargando resultados">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={`sk-search-${idx}`} className="ph-productCard">
                      <Skeleton variant="card" />
                      <div className="ph-productText">
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="40%" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="ph-empty">No encontramos productos para esa búsqueda.</p>
              ) : (
                <>
                  <div className="ph-gridProducts">
                    {items.map((p) => {
                      const responsive = toResponsiveImage(p.imageUrl);
                      const img = responsive.src ?? toAbsoluteUrl(`/images/products/${p.id}.jpg`);
                      const prices = (p.variants || [])
                        .map((v) => Number.parseFloat(String(v.price)))
                        .filter((n) => Number.isFinite(n));
                      const min = prices.length ? Math.min(...prices) : undefined;
                      const priceLabel = min != null ? formatMoney(min) : undefined;

                      return (
                        <Link key={p.id} className="ph-productCard" to={`/productos/${p.id}`}>
                          <div className="ph-productMedia">
                            <img
                              className="ph-productImg"
                              src={img}
                              srcSet={responsive.srcSet}
                              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                              alt={p.name}
                              loading="lazy"
                            />
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

                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
