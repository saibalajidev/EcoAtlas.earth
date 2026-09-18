import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Map as MapIcon, BarChart3, Bell, Settings, LogOut, Leaf } from 'lucide-react';
import { useAuth } from '../lib/auth';

const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/map', label: 'Map Explorer', icon: MapIcon },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 }
];
const sys = [
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-1 border-r border-forest-100 dark:border-white/10 bg-white/80 dark:bg-forest-950/80 backdrop-blur p-4 min-h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-2 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-800 text-white"><Leaf size={20} /></div>
        <div>
          <p className="font-display font-extrabold leading-none tracking-tight">EcoAtlas<span className="text-forest-500">.Earth</span></p>
          <p className="text-[11px] text-forest-700/60 dark:text-white/50">Mapping nature. Measuring impact.</p>
        </div>
      </div>
      <p className="label px-3 pt-3">Workspace</p>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-forest-800 text-white shadow-soft' : 'hover:bg-forest-50 dark:hover:bg-white/5 text-forest-800 dark:text-white/80'}`}>
          <l.icon size={18} />{l.label}
        </NavLink>
      ))}
      <p className="label px-3 pt-4">System</p>
      {sys.map((l) => (
        <NavLink key={l.to} to={l.to}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-forest-800 text-white shadow-soft' : 'hover:bg-forest-50 dark:hover:bg-white/5 text-forest-800 dark:text-white/80'}`}>
          <l.icon size={18} />{l.label}
        </NavLink>
      ))}
      <div className="mt-auto rounded-2xl bg-forest-50 dark:bg-white/5 p-3 text-xs text-forest-700 dark:text-white/70">
        <p className="font-semibold text-forest-800 dark:text-white">Demo data notice</p>
        <p>All metrics shown are sample/demo values for evaluation.</p>
      </div>
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-forest-100 dark:border-white/10 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-800 text-white font-bold">{(user?.name || 'A')[0]}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name || 'Admin'}</p>
          <p className="truncate text-xs opacity-60">{user?.email}</p>
        </div>
        <button aria-label="Logout" onClick={() => { logout(); nav('/login'); }} className="rounded-lg p-2 hover:bg-forest-50 dark:hover:bg-white/10"><LogOut size={16} /></button>
      </div>
    </aside>
  );
}
