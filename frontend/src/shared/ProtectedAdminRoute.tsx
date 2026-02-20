import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const TOKEN_KEY = 'petit_admin_token';

function isTokenValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    setValid(isTokenValid());
  }, [location.pathname]);

  if (valid === null) return null;
  if (!valid) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
