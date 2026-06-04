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
          <div className="adm-brandCopy">
            <span className="adm-brandText">Petit</span>
            <span className="adm-brandSubtext">Admin Studio</span>
          </div>
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
