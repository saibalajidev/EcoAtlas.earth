import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Download, Trash2, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import AnalyticsChart from '../components/AnalyticsChart';
import MapView, { MapSite } from '../components/MapView';
import SiteDrawer from '../components/SiteDrawer';
import { Skeleton, StatusBadge } from '../components/ui';

type Details = {
  id: string; name: string; status: string; location_label: string; description: string;
  project_type: string; sites_count: number; total_area_ha: number; carbon_estimate: number;
  biodiversity_avg: number; progress: number; created_at: string;
  sites: MapSite[]; performance: { months: string[]; carbon: number[]; vegetation: number[]; biodiversity: number[]; area_monitored: number[] };
};

export default function ProjectDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState<Details | null>(null);
  const [metric, setMetric] = useState<'carbon' | 'vegetation' | 'biodiversity'>('carbon');
  const [sel, setSel] = useState<MapSite | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api<Details>(`/api/projects/${id}`).then(setD).catch((e) => setErr(e instanceof Error ? e.message : 'Project not found'));
  }, [id]);
  if (err) return <div className="card p-10 text-center"><h2 className="font-display text-xl font-extrabold">Project not found</h2><p className="mt-1 text-sm opacity-60">{err}</p><Link to="/projects" className="btn-primary mx-auto mt-4 text-sm">Back to Projects</Link></div>;
  if (!d) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-96" /></div>;

  const metricData: Record<string, { label: string; color: string; data: number[] }> = {
    carbon: { label: 'Carbon sequestration (tCO₂e)', color: '#1B7A4D', data: d.performance.carbon },
    vegetation: { label: 'Vegetation index', color: '#C98A1B', data: d.performance.vegetation },
    biodiversity: { label: 'Biodiversity score', color: '#3B82F6', data: d.performance.biodiversity }
  };
  const m = metricData[metric];

  return (
    <div className="space-y-5">
      <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm font-semibold opacity-70 hover:opacity-100"><ArrowLeft size={15} /> Back</button>
      <div className="card flex flex-wrap items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-2xl font-extrabold">{d.name}</h1><StatusBadge status={d.status} /></div>
          <p className="mt-1 flex items-center gap-1.5 text-sm opacity-60"><MapPin size={14} /> {d.location_label} · {d.project_type} · since {d.created_at?.slice(0, 10)}</p>
          <p className="mt-2 max-w-2xl text-sm opacity-75">{d.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/projects/${d.id}/sites/new`} className="btn-primary text-sm"><Plus size={15} /> Add Site</Link>
          <button className="btn-ghost text-sm" onClick={() => alert('Edit project: update name, status and dates from the API (PUT /api/projects/{id}).')}><Pencil size={15} /> Edit</button>
          <button className="btn-ghost text-sm" onClick={() => {
            const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${d.name}.json`; a.click();
          }}><Download size={15} /> Export</button>
          <button className="btn-ghost text-sm !text-red-600" onClick={async () => {
            if (!confirm('Delete this project and all its sites?')) return;
            await api(`/api/projects/${d.id}`, { method: 'DELETE' }); nav('/projects');
          }}><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[['Total Sites', d.sites_count], ['Total Area', `${d.total_area_ha.toLocaleString()} ha`], ['Carbon Impact', `${d.carbon_estimate.toLocaleString()} tCO₂e`], ['Biodiversity', d.biodiversity_avg]].map(([a, b]) => (
          <div key={a as string} className="card p-4"><p className="label">{a}</p><p className="font-display text-2xl font-extrabold">{b}</p></div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display font-extrabold">Performance</h3><div className="flex-1" />
          {(['carbon', 'vegetation', 'biodiversity'] as const).map((k) => (
            <button key={k} onClick={() => setMetric(k)} className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${metric === k ? 'bg-forest-800 text-white' : 'bg-forest-50 dark:bg-white/5'}`}>{k}</button>
          ))}
        </div>
        <div className="mt-3"><AnalyticsChart labels={d.performance.months} datasets={[{ label: m.label, data: m.data, color: m.color, fill: true }]} /></div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-forest-100 dark:border-white/10 p-4"><h3 className="font-display font-extrabold">{d.sites.length} project sites</h3></div>
        <MapView sites={d.sites.map((s) => ({ ...s, project_name: d.name }))} onSelect={setSel} flyTo={sel} styleUrl="mapbox://styles/mapbox/satellite-streets-v12" height={440} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {d.sites.map((s) => (
          <Link key={s.id} to={`/sites/${s.id}`} className="card flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
            <div><p className="text-sm font-bold">{s.name}</p><p className="text-xs opacity-60">{s.area_ha.toLocaleString()} ha · {s.carbon_estimate.toLocaleString()} tCO₂e</p></div>
            <StatusBadge status={s.status} />
          </Link>
        ))}
      </div>
      <SiteDrawer site={sel ? { ...sel, project_name: d.name } : null} onClose={() => setSel(null)} />
    </div>
  );
}
