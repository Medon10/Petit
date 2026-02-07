import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, setAdminToken } from '../../shared/api';
import './styles.css';

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
    <main className="page">
      <h1 className="title">Admin · Login</h1>
      <form className="form" onSubmit={onSubmit}>
        <label className="label">
          Usuario
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className="label">
          Contraseña
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
