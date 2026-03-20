import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { getCategories, type CategoryDto } from '../../../shared/api';
import { useCart } from '../../../shared/cart';
// import AnnouncementBar from '../announcement-bar/AnnouncementBar';
import './header.css';

export default function Header() {
  const cart = useCart();
  const location = useLocation();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const navItemRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openDropdown() {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setCategoriesOpen(true);
  }

  function closeDropdown() {
    closeTimer.current = setTimeout(() => setCategoriesOpen(false), 180);
  }

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

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
        setMobileCategoriesOpen(false);
      }
    }

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
    {/*<AnnouncementBar />*/}
      <header className="ph-header ph-headerSticky">
      <div className="ph-container ph-headerInner">
        <button
          className="ph-iconButton ph-menuButton"
          type="button"
          aria-label="Abrir menú"
          aria-expanded={mobileMenuOpen}
          aria-controls="ph-mobile-menu"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <nav className="ph-nav" aria-label="Navegación principal">
          <NavLink className="ph-navLink" to="/">Inicio</NavLink>

          <div
            className="ph-navItem"
            ref={navItemRef}
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
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

        </nav>

        <Link className="ph-logo" aria-label="Petit" to="/">
          <div className="ph-brandWrap">
            <h1 className="ph-brand">Petit</h1>
            <span className="ph-brandSub">accesorios</span>
          </div>
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

      <div className={mobileMenuOpen ? 'ph-mobileMenuRoot isOpen' : 'ph-mobileMenuRoot'} aria-hidden={!mobileMenuOpen}>
        <div className="ph-mobileMenuOverlay" onClick={() => setMobileMenuOpen(false)} />
        <aside
          id="ph-mobile-menu"
          className="ph-mobileMenuDrawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="ph-mobileMenuHeader">
            <h3 className="ph-mobileMenuTitle">Menú</h3>
            <button
              type="button"
              className="ph-mobileMenuClose"
              aria-label="Cerrar menú"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </header>

          <nav className="ph-mobileNav" aria-label="Navegación móvil">
            <NavLink className="ph-mobileNavLink" to="/" onClick={() => setMobileMenuOpen(false)}>
              Inicio
            </NavLink>

            <div className="ph-mobileNavGroup">
              <button
                type="button"
                className="ph-mobileNavToggle"
                aria-expanded={mobileCategoriesOpen}
                onClick={() => setMobileCategoriesOpen((v) => !v)}
              >
                Categorías
                <span className="material-symbols-outlined" aria-hidden="true">
                  {mobileCategoriesOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              <div className={mobileCategoriesOpen ? 'ph-mobileCategories isOpen' : 'ph-mobileCategories'}>
                {categories.length ? (
                  categories.map((c) => (
                    <Link
                      key={c.id}
                      className="ph-mobileCategoryLink"
                      to={`/categorias/${c.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {c.name}
                    </Link>
                  ))
                ) : (
                  <span className="ph-mobileCategoriesEmpty">Sin categorías</span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="ph-mobileNavLink ph-mobileCartLink"
              onClick={() => {
                setMobileMenuOpen(false);
                cart.openCart();
              }}
            >
              Carrito
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
}
