import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import { getCategories, getProducts, toAbsoluteUrl, type CategoryDto, type ProductDto } from '../../shared/api';
import '../Home/Home.css';
import './styles.css';

function formatMoney(price: number) {
  if (!Number.isFinite(price)) return undefined;
  return `$${price.toFixed(2)}`;
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = Number.parseInt(String(params.id ?? ''), 10);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(categoryId)) return;
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts({ categoryId }),
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
  }, [categoryId]);

  const categoryName = useMemo(() => {
    const found = categories.find((c) => c.id === categoryId);
    return found?.name ?? (Number.isFinite(categoryId) ? `Categoría #${categoryId}` : 'Categoría');
  }, [categories, categoryId]);

  return (
    <div className="petit-category">
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Productos de la categoría">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">{categoryName}</h2>
            <div className="ph-divider" />
          </div>

          {!Number.isFinite(categoryId) ? (
            <p className="ph-empty">Categoría inválida.</p>
          ) : products.length === 0 ? (
            <p className="ph-empty">No hay productos en esta categoría.</p>
          ) : (
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
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
