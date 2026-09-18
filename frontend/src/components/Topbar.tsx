import { useEffect, useState } from 'react';
import { Bell, Moon, Sun, Search, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import SearchCommand from './SearchCommand';

const crumbs: Record<string, string> = { '/': 'Overview', '/projects': 'Projects', '/map': 'Map Explorer', '/analytics': 'Analytics', '/settings': 'Settings', '/notifications': 'Notifications' };

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const [dark, setDark] = useState(() => localStorage.getItem('ecoatlas_theme') === 'dark');
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const loc = useLocation();
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('ecoatlas_theme', dark ? 'dark' : 'light'); }, [dark]);
  useEffect(() => {
    api<{ read: boolean }[]>('/api/notifications').then((n) => setCount(n.filter((x) => !x.read).length)).catch(() => {});
    const f = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); } };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
  const base = '/' + loc.pathname.split('/')[1];
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-forest-100 dark:border-white/10 bg-cream/80 dark:bg-charcoal/80 backdrop-blur px-4 py-3">
      <button className="lg:hidden btn-ghost !px-3" onClick={onMenu} aria-label="Menu"><Menu size={18} /></button>
      <nav className="text-sm text-forest-700/60 dark:text-white/50 hidden sm:block">EcoAtlas / <span className="font-semibold text-forest-800 dark:text-white">{crumbs[base] || 'Details'}</span></nav>
      <span className="hidden md:inline-flex rounded-full bg-forest-50 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold opacity-80" title="Today">
        📅 {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
      <div className="flex-1" />
      <button onClick={() => setOpen(true)} className="btn-ghost !py-2 text-sm text-forest-700/70 dark:text-white/60">
        <Search size={16} /> <span className="hidden md:inline">Search projects, sites…</span>
        <kbd className="hidden md:inline rounded-md border border-forest-100 dark:border-white/10 px-1.5 text-[11px]">⌘K</kbd>
      </button>
      <button onClick={() => setDark(!dark)} className="btn-ghost !px-3" aria-label="Toggle theme">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
      <Link to="/notifications" className="btn-ghost !px-3 relative" aria-label="Notifications">
        <Bell size={17} />
        {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{count}</span>}
      </Link>
      {open && <SearchCommand onClose={() => setOpen(false)} />}
    </header>
  );
}
