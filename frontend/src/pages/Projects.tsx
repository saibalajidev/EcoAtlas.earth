import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { EmptyState, Skeleton, StatusBadge } from '../components/ui';

type P = { id: string; name: string; status: string; location_label: string; sites_count: number; total_area_ha: number; carbon_estimate: number; progress: number; project_type: string; updated_at: string };

export default function Projects() {
  const [items, setItems] = useState<P[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const load = async () => {
    setLoading(true);
    try { setItems(await api<P[]>(`/api/projects?search=${encodeURIComponent(q)}&status=${status}`)); setErr(''); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q, status]); // eslint-disable-line

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl sm:text-3xl font-extrabold">Projects</h1><p className="text-sm opacity-60">Manage your carbon and biodiversity initiatives.</p></div>
        <Link to="/projects/new" className="btn-primary text-sm"><Plus size={16} /> Create Project</Link>
      </div>
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-52 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="input !pl-9" aria-label="Search projects" />
        </div>
        {['All', 'Active', 'Monitoring', 'Completed', 'At Risk'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === s ? 'bg-forest-800 text-white' : 'bg-forest-50 dark:bg-white/5'}`}>{s}</button>
        ))}
      </div>
      {err && <div className="card p-4 text-sm text-red-700" role="alert">⚠ {err}</div>}
      {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-64" />)}</div>
        : items.length === 0 ? <EmptyState title="No projects yet" sub="Start your first environmental project and begin mapping your impact." action={<Link to="/projects/new" className="btn-primary mt-2 text-sm">Create Project</Link>} />
        : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="card group overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-soft">
              <div className="relative h-32 overflow-hidden" style={{ background: 'linear-gradient(135deg,#14342b,#2b614f 60%,#3c7a63)' }}>
                <svg className="absolute inset-0 h-full w-full opacity-25" aria-hidden>
                  {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={`${20 + k * 22}%`} cy="60%" rx="90" ry="26" fill="none" stroke="#fff" />)}
                </svg>
                <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{p.project_type}</span>
                <span className="absolute right-3 top-3"><StatusBadge status={p.status} /></span>
                <p className="absolute bottom-2 left-3 text-[11px] font-semibold text-white/80">📍 {p.location_label}</p>
              </div>
              <div className="p-4">
                <h3 className="font-display font-extrabold leading-snug">{p.name}</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-2"><p className="font-extrabold text-sm">{p.sites_count}</p><p className="opacity-60">Sites</p></div>
                  <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-2"><p className="font-extrabold text-sm">{p.total_area_ha.toLocaleString()}</p><p className="opacity-60">ha</p></div>
                  <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-2"><p className="font-extrabold text-sm">{p.carbon_estimate >= 1000 ? `${(p.carbon_estimate / 1000).toFixed(1)}K` : p.carbon_estimate}</p><p className="opacity-60">tCO₂e</p></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-semibold"><span className="opacity-60">Progress</span><span>{p.progress}%</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-forest-700 to-emerald-500 transition-all" style={{ width: `${p.progress}%` }} /></div>
                </div>
                <Link to={`/projects/${p.id}`} className="btn-ghost mt-4 w-full justify-center text-sm transition group-hover:bg-forest-800 group-hover:text-white">View Project</Link>
              </div>
            </motion.div>
          ))}
        </div>}
    </div>
  );
}
