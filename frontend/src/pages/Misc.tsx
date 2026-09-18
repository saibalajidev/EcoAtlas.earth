import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Leaf } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Card, EmptyState, Skeleton } from '../components/ui';

type N = { id: string; title: string; message: string; kind: string; read: boolean; created_at: string };

export function Notifications() {
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { setItems(await api<N[]>('/api/notifications')); } catch { /* noop */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  const markAll = async () => {
    await Promise.all(items.filter((i) => !i.read).map((i) => api(`/api/notifications/${i.id}/read`, { method: 'POST' }).catch(() => {})));
    load();
  };
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-end justify-between">
        <div><h1 className="font-display text-2xl sm:text-3xl font-extrabold">Notifications</h1><p className="text-sm opacity-60">Project events and data alerts.</p></div>
        <button onClick={markAll} className="btn-ghost text-xs"><CheckCheck size={15} /> Mark all read</button>
      </div>
      {loading ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)
        : items.length === 0 ? <EmptyState title="No notifications" sub="You're all caught up. New site and project events will appear here." />
        : items.map((n) => (
          <div key={n.id} className={`card flex gap-3 p-4 ${n.read ? 'opacity-70' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-800 text-white"><Bell size={16} /></div>
            <div><p className="text-sm font-bold">{n.title}</p><p className="text-sm opacity-70">{n.message}</p><p className="mt-1 text-[11px] opacity-50">{n.created_at?.slice(0, 16).replace('T', ' ')}</p></div>
          </div>
        ))}
    </div>
  );
}

export function Settings() {
  const { user } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem('ecoatlas_theme') === 'dark');
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div><h1 className="font-display text-2xl sm:text-3xl font-extrabold">Settings</h1><p className="text-sm opacity-60">Workspace preferences.</p></div>
      <Card>
        <h3 className="font-display font-extrabold">Profile</h3>
        <div className="mt-3 grid gap-3 text-sm">
          <div><label className="label">Name</label><input className="input mt-1" defaultValue={user?.name} aria-label="Name" /></div>
          <div><label className="label">Email</label><input className="input mt-1" defaultValue={user?.email} disabled aria-label="Email" /></div>
        </div>
      </Card>
      <Card>
        <h3 className="font-display font-extrabold">Appearance</h3>
        <button onClick={() => { const v = !dark; setDark(v); document.documentElement.classList.toggle('dark', v); localStorage.setItem('ecoatlas_theme', v ? 'dark' : 'light'); }}
          className="btn-ghost mt-3 text-sm">{dark ? 'Switch to light mode' : 'Switch to dark mode'}</button>
        <p className="mt-2 text-xs opacity-50">Theme preference is remembered on this device.</p>
      </Card>
      <Card>
        <h3 className="font-display font-extrabold">Backend</h3>
        <p className="mt-1 text-sm opacity-70">API: <code className="rounded bg-forest-50 dark:bg-white/10 px-1.5 py-0.5 text-xs">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</code></p>
        <p className="text-sm opacity-70">Mapbox: <code className="rounded bg-forest-50 dark:bg-white/10 px-1.5 py-0.5 text-xs">{import.meta.env.VITE_MAPBOX_TOKEN ? 'token configured' : 'token missing — map shows setup notice'}</code></p>
      </Card>
    </div>
  );
}

export function Landing() {
  return (
    <div className="space-y-6">
      <div className="card relative overflow-hidden p-8 sm:p-12" style={{ background: 'linear-gradient(140deg,#081c17,#14342b 55%,#2b614f)' }}>
        <div className="relative max-w-xl text-white">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent"><Leaf size={14} /> EcoAtlas.Earth</p>
          <h1 className="font-display mt-3 text-4xl sm:text-5xl font-extrabold leading-tight">Understand Earth's impact, one site at a time.</h1>
          <p className="mt-3 text-white/75">EcoAtlas.Earth brings carbon and biodiversity data together with geospatial intelligence.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-forest-900">Explore Dashboard</Link>
            <Link to="/projects" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white">View Projects</Link>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[['Geospatial Intelligence', 'Draw, edit and monitor every site polygon with PostGIS-backed geometry.'], ['Carbon Monitoring', 'Track sequestration trends across sites and seasons.'], ['Biodiversity Insights', 'Score habitats and watch restoration progress.'], ['Project Management', 'Multi-step creation, analytics and exports for teams.']].map(([a, b]) => (
          <div key={a} className="card p-5"><h3 className="font-display font-extrabold">{a}</h3><p className="mt-1 text-sm opacity-60">{b}</p></div>
        ))}
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-12 text-center">
      <p className="font-display text-6xl font-extrabold text-forest-200 dark:text-white/10">404</p>
      <h1 className="font-display mt-2 text-xl font-extrabold">Page not found</h1>
      <p className="mt-1 text-sm opacity-60">The view you requested doesn't exist or moved.</p>
      <Link to="/" className="btn-primary mx-auto mt-5 text-sm">Back to Dashboard</Link>
    </div>
  );
}
