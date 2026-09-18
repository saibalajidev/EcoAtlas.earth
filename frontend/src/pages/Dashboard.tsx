import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, MapPin, Trees, CloudSun, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import KpiCard from '../components/KpiCard';
import MapView, { MapSite } from '../components/MapView';
import SiteDrawer from '../components/SiteDrawer';
import AnalyticsChart from '../components/AnalyticsChart';
import { EmptyState, Skeleton, StatusBadge } from '../components/ui';

type Stats = { total_projects: number; active_sites: number; total_area_ha: number; carbon_impact: number; sparklines: Record<string, number[]>; trends: Record<string, number> };
type Project = { id: string; name: string; status: string; location_label: string; sites_count: number; total_area_ha: number; carbon_estimate: number; progress: number; project_type: string; updated_at: string };

const STYLES = [
  ['Street', 'mapbox://styles/mapbox/streets-v12'],
  ['Satellite', 'mapbox://styles/mapbox/satellite-streets-v12'],
  ['Terrain', 'mapbox://styles/mapbox/outdoors-v12'],
  ['Dark', 'mapbox://styles/mapbox/dark-v11']
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<MapSite[]>([]);
  const [sel, setSel] = useState<MapSite | null>(null);
  const [style, setStyle] = useState(STYLES[1][1]);
  const [status, setStatus] = useState('All');
  const [err, setErr] = useState('');
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    (async () => {
      try {
        const [s, p, st] = await Promise.all([
          api<Stats>('/api/dashboard/stats'),
          api<Project[]>('/api/projects'),
          api<MapSite[]>('/api/sites')
        ]);
        setStats(s); setProjects(p.slice(0, 4)); setSites(st);
      } catch (e) { setErr(e instanceof Error ? e.message : 'API unavailable — start the backend (see README).'); }
    })();
  }, []);

  const filtered = sites.filter((s) => status === 'All' || s.status === status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{greet}, {user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p className="text-sm opacity-60">Here's an overview of your environmental projects.</p>
        </div>
        <Link to="/projects/new" className="btn-primary text-sm"><Plus size={16} /> New Project</Link>
      </div>

      {err && <div className="card border-red-200 p-4 text-sm text-red-700" role="alert">⚠ {err}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!stats ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />) : (
          <>
            <KpiCard icon={FolderKanban} label="Total Projects" value={stats.total_projects} trend={`+${stats.trends.projects}%`} spark={stats.sparklines.projects} delay={0} />
            <KpiCard icon={MapPin} label="Active Sites" value={stats.active_sites} trend={`+${stats.trends.sites}%`} spark={stats.sparklines.sites} delay={1} />
            <KpiCard icon={Trees} label="Total Area" value={stats.total_area_ha} suffix="ha" trend={`+${stats.trends.area}%`} spark={stats.sparklines.area} delay={2} />
            <KpiCard icon={CloudSun} label="Est. Carbon Impact" value={stats.carbon_impact} suffix="tCO₂e" trend={`+${stats.trends.carbon}%`} spark={stats.sparklines.carbon} delay={3} />
          </>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-forest-100 dark:border-white/10 p-4">
          <h2 className="font-display font-extrabold">Live project map</h2>
          <span className="rounded-full bg-forest-50 dark:bg-white/5 px-2.5 py-1 text-xs font-semibold">{filtered.length} sites</span>
          <div className="flex-1" />
          {['All', 'Active', 'Monitoring', 'Completed', 'At Risk'].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${status === s ? 'bg-forest-800 text-white' : 'bg-forest-50 dark:bg-white/5 hover:bg-forest-100'}`}>{s}</button>
          ))}
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="input !w-auto !py-1.5 text-xs" aria-label="Map style">
            {STYLES.map(([a, b]) => <option key={b} value={b}>{a}</option>)}
          </select>
        </div>
        {sites.length === 0 && !err ? <div className="p-6"><Skeleton className="h-[520px]" /></div>
          : <MapView sites={filtered} onSelect={setSel} flyTo={sel} styleUrl={style} />}
        <div className="flex flex-wrap gap-4 border-t border-forest-100 dark:border-white/10 px-4 py-3 text-xs font-semibold">
          {[['Active', '#1B7A4D'], ['Monitoring', '#C98A1B'], ['Completed', '#3B82F6'], ['At Risk', '#DC2626']].map(([a, b]) => (
            <span key={a} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: b }} />{a}</span>
          ))}
          <span className="ml-auto opacity-50">Click a polygon for the site drawer · hover for quick stats</span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between"><h3 className="font-display font-extrabold">Portfolio carbon trend</h3><span className="text-xs opacity-50">Sample data · tCO₂e</span></div>
          <AnalyticsChart labels={['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
            datasets={[{ label: 'Carbon sequestered', data: [420, 480, 560, 640, 720, 810, 880, 950, 1020, 1100, 1180, 1280], color: '#1B7A4D', fill: true }, { label: 'Area monitored (ha x100)', data: [220, 260, 300, 330, 350, 370, 390, 400, 410, 420, 425, 428], color: '#e8b44a' }]} />
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><h3 className="font-display font-extrabold">Top projects</h3><Link to="/projects" className="text-xs font-bold text-forest-600">View all →</Link></div>
          <div className="mt-3 space-y-3">
            {projects.length === 0 ? <EmptyState title="No projects yet" sub="Start your first environmental project and begin mapping your impact." action={<Link to="/projects/new" className="btn-primary mt-2 text-sm">Create Project</Link>} /> :
              projects.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/projects/${p.id}`} className="block rounded-2xl border border-forest-100 dark:border-white/10 p-3.5 transition hover:-translate-y-0.5 hover:shadow-soft">
                    <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{p.name}</p><StatusBadge status={p.status} /></div>
                    <p className="mt-0.5 text-xs opacity-60">{p.location_label} · {p.sites_count} sites · {p.total_area_ha.toLocaleString()} ha</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-100 dark:bg-white/10"><div className="h-full rounded-full bg-forest-600" style={{ width: `${p.progress}%` }} /></div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </div>
      </div>

      <SiteDrawer site={sel} onClose={() => setSel(null)} />
    </div>
  );
}

export function AnalyticsHub() {
  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-2xl sm:text-3xl font-extrabold">Analytics</h1><p className="text-sm opacity-60">Portfolio-wide carbon, vegetation & biodiversity trends (sample data).</p></div>
      <div className="card p-5">
        <h3 className="font-display font-extrabold">Carbon vs biodiversity vs vegetation</h3>
        <AnalyticsChart labels={['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
          datasets={[
            { label: 'Carbon (tCO₂e x100)', data: [4.2, 4.8, 5.6, 6.4, 7.2, 8.1, 8.8, 9.5, 10.2, 11, 11.8, 12.8], color: '#1B7A4D', fill: true },
            { label: 'Biodiversity score', data: [52, 54, 57, 60, 63, 66, 69, 72, 74, 76, 77, 78], color: '#3B82F6' },
            { label: 'Vegetation index', data: [58, 61, 64, 67, 70, 73, 76, 79, 82, 84, 85, 86], color: '#e8b44a' }
          ]} height={320} />
      </div>
      <p className="text-xs opacity-50">Open any site for per-site time series. <Link to="/map" className="font-bold text-forest-600">Go to Map Explorer →</Link></p>
    </div>
  );
}

export function MapExplorerPage() {
  const [sites, setSites] = useState<MapSite[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; project_type: string }[]>([]);
  const [sel, setSel] = useState<MapSite | null>(null);
  const [style, setStyle] = useState(STYLES[1][1]);
  const [status, setStatus] = useState('All');
  const [type, setType] = useState('All');
  const [project, setProject] = useState('All');
  const [area, setArea] = useState('All');
  const [date, setDate] = useState('All');
  useEffect(() => {
    api<MapSite[]>('/api/sites').then(setSites).catch(() => {});
    api<{ id: string; name: string; project_type: string }[]>('/api/projects').then(setProjects).catch(() => {});
  }, []);
  const ptypeOf = (pid: string) => projects.find((p) => p.id === pid)?.project_type || '';
  const filtered = sites.filter((s) => {
    if (status !== 'All' && s.status !== status) return false;
    if (project !== 'All' && s.project_id !== project) return false;
    if (type !== 'All' && !ptypeOf(s.project_id).includes(type)) return false;
    if (area === '<100' && !(s.area_ha < 100)) return false;
    if (area === '100-500' && !(s.area_ha >= 100 && s.area_ha <= 500)) return false;
    if (area === '500-1000' && !(s.area_ha > 500 && s.area_ha <= 1000)) return false;
    if (area === '>1000' && !(s.area_ha > 1000)) return false;
    if (date !== 'All' && s.created_at) {
      const days = (Date.now() - new Date(s.created_at).getTime()) / 86400000;
      if (days > (date === '7d' ? 7 : date === '30d' ? 30 : 182)) return false;
    }
    return true;
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="font-display text-2xl sm:text-3xl font-extrabold">Map Explorer</h1><p className="text-sm opacity-60">Search, filter and inspect every monitored site.</p></div>
        <select value={style} onChange={(e) => setStyle(e.target.value)} className="input !w-auto text-sm" aria-label="Map style">{STYLES.map(([a, b]) => <option key={b} value={b}>{a}</option>)}</select>
      </div>
      <div className="card space-y-2 p-3 text-xs font-semibold">
        <div className="flex flex-wrap gap-2">
          {['All', 'Active', 'Monitoring', 'Completed', 'At Risk'].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 ${status === s ? 'bg-forest-800 text-white' : 'bg-forest-50 dark:bg-white/5'}`}>{s}</button>
          ))}
          <span className="mx-1 opacity-30">|</span>
          {['All', 'Carbon', 'Biodiversity'].map((t) => (
            <button key={t} onClick={() => setType(t)} className={`rounded-full px-3 py-1.5 ${type === t ? 'bg-forest-800 text-white' : 'bg-forest-50 dark:bg-white/5'}`}>{t}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={project} onChange={(e) => setProject(e.target.value)} className="input !w-auto !py-1.5" aria-label="Filter by project">
            <option value="All">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="input !w-auto !py-1.5" aria-label="Filter by area">
            <option value="All">Any area</option>
            <option value="<100">&lt;100 ha</option>
            <option value="100-500">100–500 ha</option>
            <option value="500-1000">500–1000 ha</option>
            <option value=">1000">&gt;1000 ha</option>
          </select>
          <select value={date} onChange={(e) => setDate(e.target.value)} className="input !w-auto !py-1.5" aria-label="Filter by date">
            <option value="All">Any time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="6m">Last 6 months</option>
          </select>
          <span className="ml-auto opacity-60">{filtered.length} of {sites.length} sites · filters apply live</span>
        </div>
      </div>
      <div className="card overflow-hidden p-0"><MapView sites={filtered} onSelect={setSel} flyTo={sel} styleUrl={style} height={600} /></div>
      <SiteDrawer site={sel} onClose={() => setSel(null)} />
    </div>
  );
}

export function ProjectRowCTA() {
  return <Link to="/projects/new" className="btn-primary text-sm">Create Project <ArrowRight size={15} /></Link>;
}
