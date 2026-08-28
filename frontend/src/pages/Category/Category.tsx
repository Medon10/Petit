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

  return (
    <div className="petit-category">
      <Helmet>
        <title>{`${categoryName} | Petit Accesorios`}</title>
        <meta name="description" content={`Explorá ${categoryName} en Petit Accesorios. Diseños personalizados en acero quirúrgico.`} />
        <link rel="canonical" href={`https://petitaccesorios.com.ar/categorias/${categoryId}`} />
        <meta property="og:title" content={`${categoryName} | Petit Accesorios`} />
        <meta property="og:description" content={`Explorá ${categoryName} en Petit Accesorios. Diseños personalizados en acero quirúrgico.`} />
        <meta property="og:url" content={`https://petitaccesorios.com.ar/categorias/${categoryId}`} />
        <meta name="twitter:title" content={`${categoryName} | Petit Accesorios`} />
        <meta name="twitter:description" content={`Explorá ${categoryName} en Petit Accesorios.`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://petitaccesorios.com.ar/" },
            { "@type": "ListItem", "position": 2, "name": "Categorías", "item": "https://petitaccesorios.com.ar/categorias" },
            { "@type": "ListItem", "position": 3, "name": categoryName, "item": `https://petitaccesorios.com.ar/categorias/${categoryId}` }
          ]
        })}</script>
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
              </div>

              <div className="ph-gridProducts">
                {products.map((p) => {
                const responsive = toResponsiveImage(p.imageUrl);
                const img = responsive.src ?? toAbsoluteUrl(`/images/products/${p.id}.jpg`);
                const min = (p.variants || []).reduce<number | undefined>((acc, v) => {
                  const n = Number.parseFloat(String(v.price));
                  return Number.isFinite(n) ? (acc == null ? n : Math.min(acc, n)) : acc;
                }, undefined);
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

