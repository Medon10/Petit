import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { adminLogin, setAdminToken } from '../../shared/api';
import './AdminLogin.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminLogin({ username, password });
      if (!res?.token) throw new Error('Token inválido');
      setAdminToken(res.token);
      navigate('/admin/catalogo');
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <Helmet>
        <title>Admin Login | Petit</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Acceso Administrador</h1>
          <p>Ingresa tus credenciales para gestionar el sitio</p>
        </div>

        <form className="admin-login-form" onSubmit={onSubmit}>
          <div className="admin-login-field">
            <label htmlFor="username">Usuario</label>
            <input 
              id="username"
              type="text"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Ej. admin"
              autoComplete="username"
              required
            />
          </div>
          
          <div className="admin-login-field">
            <label htmlFor="password">Contraseña</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <button className="admin-login-button" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </main>
  );
}
