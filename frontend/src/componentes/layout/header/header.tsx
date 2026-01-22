import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getCategories, type CategoryDto } from '../../../shared/api';
import { useCart } from '../../../shared/cart';
import './header.css';

export default function Header() {
  const cart = useCart();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const navItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const cats = await getCategories();
        if (cancelled) return;
        setCategories(cats);
      } catch {
        if (cancelled) return;
        setCategories([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!categoriesOpen) return;

    function onPointerDown(e: PointerEvent) {
      const root = navItemRef.current;
      if (!root) return;
      if (root.contains(e.target as Node)) return;
      setCategoriesOpen(false);
    }

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [categoriesOpen]);

  return (
    <header className="ph-header ph-headerSticky">
      <div className="ph-container ph-headerInner">
        <button className="ph-iconButton ph-menuButton" type="button" aria-label="Abrir menú">
          <span className="material-symbols-outlined">menu</span>
        </button>

        <nav className="ph-nav" aria-label="Navegación principal">
          <NavLink className="ph-navLink" to="/">Inicio</NavLink>

          <div
            className="ph-navItem"
            ref={navItemRef}
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button
              className="ph-navLink ph-navButton"
              type="button"
              aria-haspopup="menu"
              aria-expanded={categoriesOpen}
              onClick={() => setCategoriesOpen((v) => !v)}
            >
              Categorías
              <span className="material-symbols-outlined ph-navChevron" aria-hidden="true">
                expand_more
              </span>
            </button>

            <div className={categoriesOpen ? 'ph-dropdown isOpen' : 'ph-dropdown'} role="menu" aria-label="Categorías">
              {categories.length ? (
                categories.map((c) => (
                  <Link
                    key={c.id}
                    className="ph-dropdownItem"
                    to={`/categorias/${c.id}`}
                    role="menuitem"
                    onClick={() => setCategoriesOpen(false)}
                  >
                    {c.name}
                  </Link>
                ))
              ) : (
                <span className="ph-dropdownEmpty">Sin categorías</span>
              )}
            </div>
          </div>

          <NavLink className="ph-navLink" to="/acerca">Acerca de Nosotros</NavLink>
          <NavLink className="ph-navLink" to="/contacto">Contacto</NavLink>
        </nav>

        <Link className="ph-logo" aria-label="Petit" to="/">
          <div className="ph-logoMark" aria-hidden="true">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16zm-2-26h4v12h-4V14zm0 16h4v4h-4v-4z"></path>
              <path d="M12,24 L24,6 L36,24 L24,42 Z" fill="currentColor"></path>
            </svg>
          </div>
          <h1 className="ph-brand">Petit</h1>
        </Link>

        <div className="ph-actions">
          <button className="ph-iconButton" type="button" aria-label="Buscar">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button className="ph-iconLink ph-cartButton" type="button" aria-label="Carrito" onClick={() => cart.openCart()}>
            <span className="material-symbols-outlined">shopping_bag</span>
            {cart.totalItems > 0 ? <span className="ph-cartDot" aria-hidden="true" /> : null}
            {cart.totalItems > 0 ? (
              <span className="ph-cartCount" aria-label={`${cart.totalItems} productos en carrito`}>{cart.totalItems}</span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
