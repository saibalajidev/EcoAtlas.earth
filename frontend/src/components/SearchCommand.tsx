import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function SearchCommand({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ projects: { id: string; name: string; location: string }[]; sites: { id: string; name: string; project_id: string }[] }>({ projects: [], sites: [] });
  const nav = useNavigate();
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setRes({ projects: [], sites: [] }); return; }
      try { setRes(await api(`/api/search?q=${encodeURIComponent(q)}`)); } catch { /* offline */ }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24" onClick={onClose} role="dialog" aria-label="Global search">
      <div className="w-full max-w-lg card overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects, sites, locations… (try “Western Ghats”)"
          className="w-full border-b border-forest-100 dark:border-white/10 bg-transparent px-5 py-4 text-sm outline-none" aria-label="Search" />
        <div className="max-h-72 overflow-auto p-2">
          {res.projects.map((p) => (
            <button key={p.id} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-forest-50 dark:hover:bg-white/5"
              onClick={() => { nav(`/projects/${p.id}`); onClose(); }}>
              <span>🌲 {p.name}<span className="block text-xs opacity-60">{p.location}</span></span>
              <span className="text-xs opacity-50">Project</span>
            </button>
          ))}
          {res.sites.map((s) => (
            <button key={s.id} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-forest-50 dark:hover:bg-white/5"
              onClick={() => { nav(`/sites/${s.id}`); onClose(); }}>
              <span>📍 {s.name}</span><span className="text-xs opacity-50">Site</span>
            </button>
          ))}
          {!q && <p className="px-3 py-6 text-center text-sm opacity-60">Type to search across projects, sites and locations.</p>}
          {q && !res.projects.length && !res.sites.length && <p className="px-3 py-6 text-center text-sm opacity-60">No results for “{q}”.</p>}
        </div>
        <div className="border-t border-forest-100 dark:border-white/10 p-2 text-center"><Link to="/projects" onClick={onClose} className="text-xs font-semibold text-forest-600">Browse all projects →</Link></div>
      </div>
    </div>
  );
}
