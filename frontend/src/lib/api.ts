const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getToken() { return localStorage.getItem('ecoatlas_token') || ''; }
export function setToken(t: string) { localStorage.setItem('ecoatlas_token', t); }
export function clearToken() { localStorage.removeItem('ecoatlas_token'); }

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(opts.headers || {})
    }
  });
  if (res.status === 401) { clearToken(); if (!location.pathname.includes('/login')) location.href = '/login'; }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const API_BASE = API;
