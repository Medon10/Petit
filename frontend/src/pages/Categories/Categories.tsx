import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import Skeleton from '../../componentes/shared/Skeleton';
import { getCategories, toAbsoluteUrl, type CategoryDto } from '../../shared/api';
import '../Home/Home.css';
import './Categories.css';

function CategoryCoverImage({
  id,
  name,
  imageUrl,
  representativeImageUrl,
}: {
  id: number;
  name: string;
  imageUrl?: string | null;
  representativeImageUrl?: string | null;
}) {
  const sources = [
    toAbsoluteUrl(imageUrl),
    toAbsoluteUrl(representativeImageUrl),
    toAbsoluteUrl(`/images/categories/${id}.jpg`),
    '/images/placeholder-category.jpg',
  ].filter(Boolean) as string[];

  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[Math.min(sourceIndex, sources.length - 1)];

  return (
    <img
      src={src}
      alt={name}
      className="ph-categoryImg"
      loading="lazy"
      onError={() => setSourceIndex((current) => Math.min(current + 1, sources.length - 1))}
    />
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getCategories({ includeRepresentative: true });
        if (cancelled) return;
        setCategories(data.filter((c) => c.isActive !== false));
      } catch {
        if (cancelled) return;
        setCategories([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="petit-categories">
      <Helmet>
        <title>Categorías | Petit Accesorios</title>
        <meta name="description" content="Explorá todas las categorías de Petit Accesorios y encontrá tu próximo diseño personalizado." />
        <link rel="canonical" href="https://petitaccesorios.com.ar/categorias" />
        <meta property="og:title" content="Categorías | Petit Accesorios" />
        <meta property="og:description" content="Explorá todas las categorías de Petit Accesorios y encontrá tu próximo diseño personalizado." />
        <meta property="og:url" content="https://petitaccesorios.com.ar/categorias" />
        <meta name="twitter:title" content="Categorías | Petit Accesorios" />
        <meta name="twitter:description" content="Explorá todas las categorías de Petit Accesorios." />
      </Helmet>
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Categorías">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Categorías</h2>
            <div className="ph-divider" />
          </div>

          {loading ? (
            <div className="ph-categoriesGrid" aria-label="Cargando categorías">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`sk-cat-${idx}`} className="ph-categoryCard">
                  <Skeleton variant="card" />
                  <div className="ph-categoryBody">
                    <Skeleton variant="text" width="65%" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="ph-empty">No hay categorías disponibles.</p>
          ) : (
            <div className="ph-categoriesGrid">
              {categories.map((c) => {
                return (
                  <Link key={c.id} to={`/categorias/${c.id}`} className="ph-categoryCard">
                    <div className="ph-categoryMedia">
                      <CategoryCoverImage
                        id={c.id}
                        name={c.name}
                        imageUrl={c.imageUrl}
                        representativeImageUrl={c.representativeImageUrl}
                      />
                    </div>
                    <div className="ph-categoryBody">
                      <h3 className="ph-categoryName">{c.name}</h3>
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

