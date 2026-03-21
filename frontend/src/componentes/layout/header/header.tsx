import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getCategories, searchProducts, type CategoryDto, type ProductDto } from '../../../shared/api';
import { useCart } from '../../../shared/cart';
// import AnnouncementBar from '../announcement-bar/AnnouncementBar';
import './header.css';

const RECENT_SEARCHES_KEY = 'petit_recent_searches';

function fromPrice(product: ProductDto) {
  const prices = (product.variants || [])
    .map((v) => Number.parseFloat(String(v.price)))
    .filter((n) => Number.isFinite(n));
  if (!prices.length) return null;
  return Math.min(...prices);
}

function moneyAr(amount: number) {
  if (!Number.isFinite(amount)) return '$0';
  return `$${Math.round(amount).toLocaleString('es-AR')}`;
}

export default function Header() {
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navItemRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
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
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((x) => typeof x === 'string').slice(0, 5));
      }
    } catch {
      setRecentSearches([]);
    }
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
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
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

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchLoading(false);
      setActiveSearchIndex(-1);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchProducts(query);
        if (cancelled) return;
        setSearchResults(results);
        setActiveSearchIndex(results.length ? 0 : -1);
      } catch {
        if (cancelled) return;
        setSearchResults([]);
        setActiveSearchIndex(-1);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!searchRef.current) return;
      if (searchRef.current.contains(e.target as Node)) return;
      setSearchOpen(false);
    }
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [searchOpen]);

  function registerRecentSearch(term: string) {
    const q = term.trim();
    if (!q) return;
    const next = [q, ...recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function onSearchInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (!searchResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSearchIndex((prev) => (prev + 1) % searchResults.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSearchIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
      return;
    }
    if (e.key === 'Enter' && activeSearchIndex >= 0) {
      e.preventDefault();
      const item = searchResults[activeSearchIndex];
      if (!item) return;
      registerRecentSearch(searchQuery);
      navigate(`/productos/${item.id}`);
    }
    if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  }

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
          <button
            className="ph-iconButton"
            type="button"
            aria-label="Buscar"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
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

        <div ref={searchRef} className={searchOpen ? 'ph-searchOverlay isOpen' : 'ph-searchOverlay'}>
          <input
            className="ph-searchInput"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={onSearchInputKeyDown}
          />
          {searchOpen ? (
            <div className="ph-searchResults" role="listbox" aria-label="Resultados de búsqueda">
              {searchLoading ? <div className="ph-searchEmpty">Buscando...</div> : null}
              {!searchLoading && !searchResults.length && searchQuery.trim() ? (
                <div className="ph-searchEmpty">Sin resultados</div>
              ) : null}
              {!searchLoading && !searchQuery.trim() ? (
                recentSearches.length ? (
                  <div className="ph-searchRecent">
                    <div className="ph-searchRecentTitle">Búsquedas recientes</div>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        className="ph-searchRecentBtn"
                        onClick={() => setSearchQuery(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                ) : <div className="ph-searchEmpty">Escribí para buscar</div>
              ) : null}
              {searchResults.map((p, idx) => {
                const price = fromPrice(p);
                return (
                  <Link
                    key={p.id}
                    className={activeSearchIndex === idx ? 'ph-searchItem isActive' : 'ph-searchItem'}
                    to={`/productos/${p.id}`}
                    onClick={() => {
                      registerRecentSearch(searchQuery);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <span className="ph-searchItemTitle">{p.name}</span>
                    <span className="ph-searchItemMeta">
                      {p.category?.name || 'Sin categoría'}
                      {price != null ? ` · desde ${moneyAr(price)}` : ''}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
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
            <div className="ph-mobileSearchBox">
              <label className="ph-mobileSearchLabel" htmlFor="mobile-search">Buscar</label>
              <input
                id="mobile-search"
                className="ph-mobileSearchInput"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onSearchInputKeyDown}
              />
              {searchQuery.trim() ? (
                <div className="ph-mobileSearchResults">
                  {searchLoading ? <div className="ph-searchEmpty">Buscando...</div> : null}
                  {!searchLoading && !searchResults.length ? <div className="ph-searchEmpty">Sin resultados</div> : null}
                  {searchResults.slice(0, 8).map((p) => (
                    <Link
                      key={`m-${p.id}`}
                      className="ph-mobileSearchItem"
                      to={`/productos/${p.id}`}
                      onClick={() => {
                        registerRecentSearch(searchQuery);
                        setMobileMenuOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

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
