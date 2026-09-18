import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import DrawMap, { DrawResult } from '../components/DrawMap';

export default function AddSite() {
  const { id } = useParams();
  const nav = useNavigate();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [projectId, setProjectId] = useState(id || '');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [stype, setStype] = useState('Restoration');
  const [status, setStatus] = useState('Active');
  const [draw, setDraw] = useState<DrawResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api<{ id: string; name: string }[]>('/api/projects').then((p) => {
      setProjects(p);
      if (!projectId && p.length) setProjectId(p[0].id);
    }).catch(() => {});
  }, []); // eslint-disable-line

  const save = async () => {
    setErr('');
    if (!projectId) { setErr('Select a project.'); return; }
    if (name.trim().length < 2) { setErr('Enter a site name.'); return; }
    if (!draw) { setErr('Draw a polygon on the map first — area is required.'); return; }
    setBusy(true);
    try {
      const s = await api<{ id: string }>('/api/sites', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, name, description: desc, site_type: stype, status, geometry: draw.geometry })
      });
      nav(`/sites/${s.id}`);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm font-semibold opacity-70 hover:opacity-100"><ArrowLeft size={15} /> Back</button>
      <div><h1 className="font-display text-2xl sm:text-3xl font-extrabold">Add Site · Draw Polygon</h1><p className="text-sm opacity-60">Boundary is stored as PostGIS geometry (GeoJSON → GEOMETRY).</p></div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card space-y-3 p-5 lg:col-span-2">
          <div><label className="label">Project</label><select className="input mt-1" value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="label">Site name</label><input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Karnataka-04" /></div>
          <div><label className="label">Description</label><textarea className="input mt-1" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Intervention, species mix…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Site type</label><select className="input mt-1" value={stype} onChange={(e) => setStype(e.target.value)}>{['Restoration', 'Conservation', 'Agroforestry', 'Mangrove'].map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className="label">Status</label><select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>{['Active', 'Monitoring', 'Completed', 'At Risk'].map((t) => <option key={t}>{t}</option>)}</select></div>
          </div>
          {draw && (
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-3"><p className="label">Site area</p><p className="font-display text-lg font-extrabold">{draw.area_ha} ha</p></div>
              <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-3"><p className="label">Perimeter</p><p className="font-display text-lg font-extrabold">{draw.perimeter_km} km</p></div>
              <div className="col-span-2 rounded-xl bg-forest-50 dark:bg-white/5 p-3"><p className="label">Center</p><p className="font-bold">{draw.centroid_lat.toFixed(4)}° N · {draw.centroid_lng.toFixed(4)}° E</p></div>
            </div>
          )}
          {err && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{err}</p>}
          <button className="btn-primary w-full text-sm" disabled={busy} onClick={save}>{busy && <Loader2 className="animate-spin" size={16} />} Save Site</button>
        </div>
        <div className="card p-4 lg:col-span-3"><DrawMap onChange={setDraw} /></div>
      </div>
    </div>
  );
}
