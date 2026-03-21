import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../componentes/layout/header/header';
import Footer from '../../componentes/layout/footer/footer';
import { getCategories, toAbsoluteUrl, type CategoryDto } from '../../shared/api';
import '../Home/Home.css';
import './Categories.css';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Petit Accesorios | Categorías';
    return () => {
      document.title = prevTitle;
    };
  }, []);

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
      <Header />

      <section className="ph-section ph-sectionTight" aria-label="Categorías">
        <div className="ph-container">
          <div className="ph-sectionTitle">
            <h2 className="ph-h2">Categorías</h2>
            <div className="ph-divider" />
          </div>

          {loading ? (
            <p className="ph-empty">Cargando categorías...</p>
          ) : categories.length === 0 ? (
            <p className="ph-empty">No hay categorías disponibles.</p>
          ) : (
            <div className="ph-categoriesGrid">
              {categories.map((c) => {
                const image = toAbsoluteUrl(c.representativeImageUrl) ?? '/images/placeholder-category.jpg';
                return (
                  <Link key={c.id} to={`/categorias/${c.id}`} className="ph-categoryCard">
                    <div className="ph-categoryMedia">
                      <img src={image} alt={c.name} className="ph-categoryImg" loading="lazy" />
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

