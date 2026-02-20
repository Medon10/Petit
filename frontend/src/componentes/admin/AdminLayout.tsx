import { NavLink, useNavigate } from 'react-router-dom';
import { clearAdminToken } from '../../shared/api';
import './AdminLayout.css';

type Props = { children: React.ReactNode };

export default function AdminLayout({ children }: Props) {
  const navigate = useNavigate();

  function onLogout() {
    clearAdminToken();
    navigate('/admin/login');
  }

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-sidebarBrand">
          <span className="adm-brandIcon">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
              <path d="M12,24 L24,6 L36,24 L24,42 Z" />
            </svg>
          </span>
          <span className="adm-brandText">Petit Admin</span>
        </div>

        <nav className="adm-nav">
          <NavLink className={({ isActive }) => `adm-navLink${isActive ? ' active' : ''}`} to="/admin/catalogo" end>
            <span className="material-symbols-outlined" aria-hidden="true">inventory_2</span>
            Catálogo
          </NavLink>
          <NavLink className={({ isActive }) => `adm-navLink${isActive ? ' active' : ''}`} to="/admin/pedidos">
            <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
            Pedidos
          </NavLink>
        </nav>

        <div className="adm-sidebarFooter">
          <NavLink className="adm-navLink" to="/" target="_blank">
            <span className="material-symbols-outlined" aria-hidden="true">storefront</span>
            Ver tienda
          </NavLink>
          <button className="adm-navLink adm-logoutBtn" type="button" onClick={onLogout}>
            <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="adm-main">{children}</main>
    </div>
  );
}
