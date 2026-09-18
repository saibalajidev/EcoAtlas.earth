import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, FolderKanban, Map as MapIcon, BarChart3 } from 'lucide-react';
import { useAuth } from './lib/auth';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Login, Register } from './pages/Auth';
import Dashboard, { AnalyticsHub, MapExplorerPage } from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import AddSite from './pages/AddSite';
import SiteAnalytics from './pages/SiteAnalytics';
import { Landing, NotFound, Notifications, Settings } from './pages/Misc';

function Guard({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-sm opacity-60">Loading EcoAtlas…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();
  const tabs = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/map', icon: MapIcon, label: 'Map' },
    { to: '/analytics', icon: BarChart3, label: 'Stats' }
  ];
  return (
    <div className="min-h-screen bg-cream text-charcoal dark:bg-charcoal dark:text-white">
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar onMenu={() => setMobile(!mobile)} />
          {mobile && (
            <nav className="grid grid-cols-4 gap-1 border-b border-forest-100 dark:border-white/10 bg-white dark:bg-forest-950 p-2 lg:hidden">
              {tabs.map((t) => <Link key={t.to} to={t.to} onClick={() => setMobile(false)} className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold hover:bg-forest-50 dark:hover:bg-white/5"><t.icon size={18} />{t.label}</Link>)}
            </nav>
          )}
          <AnimatePresence mode="wait">
            <motion.main key={loc.pathname.split('/')[1]} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="mx-auto w-full max-w-7xl p-4 sm:p-6 pb-24 lg:pb-10">
              <Routes location={loc}>
                <Route index element={<Dashboard />} />
                <Route path="welcome" element={<Landing />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/new" element={<CreateProject />} />
                <Route path="projects/:id" element={<ProjectDetails />} />
                <Route path="projects/:id/sites/new" element={<AddSite />} />
                <Route path="sites/:id" element={<SiteAnalytics />} />
                <Route path="map" element={<MapExplorerPage />} />
                <Route path="analytics" element={<AnalyticsHub />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.main>
          </AnimatePresence>
          <nav className="fixed bottom-0 inset-x-0 z-30 grid grid-cols-4 border-t border-forest-100 dark:border-white/10 bg-white/95 dark:bg-forest-950/95 backdrop-blur lg:hidden">
            {tabs.map((t) => <Link key={t.to} to={t.to} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold opacity-80"><t.icon size={19} />{t.label}</Link>)}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={<Guard><Shell /></Guard>} />
    </Routes>
  );
}
