import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from './api';

export type User = { id: string; name: string; email: string; role: string };
type Ctx = { user: User | null; loading: boolean; login: (e: string, p: string) => Promise<void>; register: (n: string, e: string, p: string) => Promise<void>; logout: () => void; };

const AuthCtx = createContext<Ctx>({} as Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('ecoatlas_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      if (!getToken()) { setLoading(false); return; }
      try { const me = await api<User>('/api/auth/me'); setUser(me); localStorage.setItem('ecoatlas_user', JSON.stringify(me)); }
      catch { clearToken(); setUser(null); }
      setLoading(false);
    })();
  }, []);
  const login = async (email: string, password: string) => {
    const r = await api<{ access_token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(r.access_token); setUser(r.user); localStorage.setItem('ecoatlas_user', JSON.stringify(r.user));
  };
  const register = async (name: string, email: string, password: string) => {
    const r = await api<{ access_token: string; user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    setToken(r.access_token); setUser(r.user); localStorage.setItem('ecoatlas_user', JSON.stringify(r.user));
  };
  const logout = () => { clearToken(); localStorage.removeItem('ecoatlas_user'); setUser(null); };
  return <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
