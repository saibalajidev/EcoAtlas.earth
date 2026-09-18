import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import { ArrowLeft, Crosshair, Leaf, Sprout, Activity, Scan } from 'lucide-react';
import { api } from '../lib/api';
import AnalyticsChart from '../components/AnalyticsChart';
import { Skeleton, StatusBadge } from '../components/ui';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

type A = {
  site: { id: string; name: string; area_ha: number; carbon_estimate: number; biodiversity_score: number; vegetation_index: number; coverage_pct: number };
  series: { month: string; carbon: number; vegetation: number; biodiversity: number; area_monitored: number }[];
};
type Full = { project_id: string; project_name: string; name: string; status: string; description: string; centroid_lat: number; centroid_lng: number; geometry: { coordinates: number[][][] } };

export default function SiteAnalytics() {
  const { id } = useParams();
  const [a, setA] = useState<A | null>(null);
  const [full, setFull] = useState<Full | null>(null);
  const [err, setErr] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api<A>(`/api/sites/${id}/analytics`), api<Full>(`/api/sites/${id}`)])
      .then(([x, y]) => { setA(x); setFull(y); })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Site not found'));
  }, [id]);

  useEffect(() => {
    if (!full?.geometry || !mapRef.current || !TOKEN || TOKEN.includes('YOUR_MAPBOX')) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({ container: mapRef.current, style: 'mapbox://styles/mapbox/satellite-streets-v12', center: [full.centroid_lng, full.centroid_lat], zoom: 12 });
    map.on('load', () => {
      map.addSource('site', { type: 'geojson', data: { type: 'Feature', geometry: full.geometry, properties: {} } as never });
      map.addLayer({ id: 'fill', type: 'fill', source: 'site', paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.35 } });
      map.addLayer({ id: 'line', type: 'line', source: 'site', paint: { 'line-color': '#4ade80', 'line-width': 3, 'line-blur': 1 } });
      const b = new mapboxgl.LngLatBounds();
      full.geometry.coordinates[0].forEach(([lng, lat]) => b.extend([lng, lat]));
      map.fitBounds(b, { padding: 50 });
      (window as unknown as { __fit?: () => void }).__fit = () => map.fitBounds(b, { padding: 50 });
    });
    return () => map.remove();
  }, [full]);

  if (err) return <div className="card p-10 text-center"><h2 className="font-display text-xl font-extrabold">Site not found</h2><p className="text-sm opacity-60">{err}</p><Link to="/map" className="btn-primary mx-auto mt-4 text-sm">Back to Map</Link></div>;
  if (!a || !full) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;

  const cards = [
    { icon: Leaf, label: 'Carbon Sequestration', v: `${a.site.carbon_estimate.toLocaleString()} tCO₂e` },
    { icon: Sprout, label: 'Vegetation Health', v: `${a.site.vegetation_index}%` },
    { icon: Activity, label: 'Biodiversity Index', v: `${a.site.biodiversity_score}` },
    { icon: Scan, label: 'Site Coverage', v: `${a.site.coverage_pct}%` }
  ];
  const labels = a.series.map((s) => s.month.slice(5));

  return (
    <div className="space-y-5">
      <Link to="/map" className="flex items-center gap-1.5 text-sm font-semibold opacity-70 hover:opacity-100"><ArrowLeft size={15} /> All sites</Link>
      <div className="card flex flex-wrap items-center gap-3 p-5">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-500">Site Analytics · {full.project_name}</p>
          <h1 className="font-display text-2xl font-extrabold">{full.name}</h1>
          <p className="mt-1 text-sm opacity-60">{a.site.area_ha.toLocaleString()} ha · {full.centroid_lat.toFixed(4)}°, {full.centroid_lng.toFixed(4)}° · {full.description || 'Demo monitoring site.'}</p>
        </div>
        <StatusBadge status={full.status} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-800 text-white"><c.icon size={17} /></div>
            <p className="label mt-3">{c.label}</p><p className="font-display text-2xl font-extrabold">{c.v}</p></div>
        ))}
      </div>
      <div className="card overflow-hidden p-0">
        <div className="flex items-center gap-2 p-4"><h3 className="font-display font-extrabold">Site boundary</h3><div className="flex-1" />
          <button className="btn-ghost text-xs" onClick={() => (window as unknown as { __fit?: () => void }).__fit?.()}><Crosshair size={14} /> Fit to Site</button></div>
        {TOKEN.includes('YOUR_MAPBOX') || !TOKEN ? <p className="px-4 pb-4 text-sm opacity-60">Set VITE_MAPBOX_TOKEN to render satellite boundary.</p> : <div ref={mapRef} style={{ height: 380 }} />}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5"><h3 className="font-display font-extrabold">Carbon performance over time</h3><div className="mt-2"><AnalyticsChart labels={labels} datasets={[{ label: 'tCO₂e', data: a.series.map((s) => s.carbon), color: '#1B7A4D', fill: true }]} /></div></div>
        <div className="card p-5"><h3 className="font-display font-extrabold">Vegetation & biodiversity</h3><div className="mt-2"><AnalyticsChart labels={labels} datasets={[{ label: 'Vegetation %', data: a.series.map((s) => s.vegetation), color: '#C98A1B' }, { label: 'Biodiversity', data: a.series.map((s) => s.biodiversity), color: '#3B82F6', fill: true }]} /></div></div>
      </div>
      <p className="text-xs opacity-50">Sample/demo time-series for evaluation — not real-world measurements.</p>
    </div>
  );
}
