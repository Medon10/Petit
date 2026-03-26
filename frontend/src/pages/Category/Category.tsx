import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import Pagination from '../../componentes/shared/Pagination';
import Skeleton from '../../componentes/shared/Skeleton';
import { getCategories, getProductsPage, toAbsoluteUrl, toResponsiveImage, type CategoryDto, type ProductDto } from '../../shared/api';
import '../Home/Home.css';
import './Category.css';

function formatMoney(price: number) {
  if (!Number.isFinite(price)) return undefined;
  return `$${price.toFixed(2)}`;
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = Number.parseInt(String(params.id ?? ''), 10);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name_asc' | 'name_desc'>('name_asc');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(categoryId)) return;
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProductsPage({ categoryId, page, limit: 12 }),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setProducts(prods.data);
        setTotalPages(prods.totalPages || 1);
        setTotal(prods.total || 0);
      } catch {
        if (cancelled) return;
        setCategories([]);
        setProducts([]);
        setTotalPages(1);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [categoryId, page]);

  useEffect(() => {
    setPage(1);
  }, [categoryId]);

  const categoryName = useMemo(() => {
    const found = categories.find((c) => c.id === categoryId);
    return found?.name ?? (Number.isFinite(categoryId) ? `Categoría #${categoryId}` : 'Categoría');
  }, [categories, categoryId]);

  const sortedProducts = useMemo(() => {
    const minPrice = (p: ProductDto) => {
      const values = (p.variants || [])
        .map((v) => Number.parseFloat(String(v.price)))
        .filter((n) => Number.isFinite(n));
      return values.length ? Math.min(...values) : Number.POSITIVE_INFINITY;
    };

    const list = [...products];
    list.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      if (sortBy === 'price_asc') return minPrice(a) - minPrice(b);
      return minPrice(b) - minPrice(a);
    });

    return list;
  }, [products, sortBy]);

  return (
    <div className="petit-category">
      <Helmet>
        <title>{`${categoryName} | Petit Accesorios`}</title>
        <meta name="description" content={`Explorá ${categoryName} en Petit Accesorios. Diseños personalizados en acero quirúrgico.`} />
      </Helmet>
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Productos de la categoría">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">{categoryName}</h2>
            <div className="ph-divider" />
          </div>

          {!Number.isFinite(categoryId) ? (
            <p className="ph-empty">Categoría inválida.</p>
          ) : loading ? (
            <div className="ph-gridProducts" aria-label="Cargando productos">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`sk-${idx}`} className="ph-productCard">
                  <Skeleton variant="card" />
                  <div className="ph-productText">
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="40%" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="ph-empty">No hay productos en esta categoría.</p>
          ) : (
            <>
              <div className="ph-categoryToolbar">
                <span className="ph-categoryCount">{total} resultado(s)</span>
                <label className="ph-categorySortLabel" htmlFor="category-sort">Ordenar por</label>
                <select
                  id="category-sort"
                  className="ph-categorySort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="name_asc">Nombre A-Z</option>
                  <option value="name_desc">Nombre Z-A</option>
                </select>
              </div>

              <div className="ph-gridProducts">
                {sortedProducts.map((p) => {
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
        </div>
      </section>

      <Footer />
    </div>
  );
}

