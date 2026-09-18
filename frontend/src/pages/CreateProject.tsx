import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import DrawMap, { DrawResult } from '../components/DrawMap';

const TYPES = ['Carbon', 'Biodiversity', 'Carbon + Biodiversity'];
const STATUS = ['Active', 'Monitoring', 'Completed', 'At Risk'];

export default function CreateProject() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ name: '', project_type: TYPES[0], description: '', start_date: '2025-01-01', end_date: '2027-12-31', owner: 'Admin', location_label: 'Western Ghats, Karnataka', status: STATUS[0] });
  const [draw, setDraw] = useState<DrawResult | null>(null);

  useEffect(() => { api<{ id: string; name: string }[]>('/api/projects').then(setProjects).catch(() => {}); }, []);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    setBusy(true); setErr('');
    try {
      const p = await api<{ id: string }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, description: form.description, project_type: form.project_type, status: form.status, location_label: form.location_label, start_date: form.start_date, end_date: form.end_date })
      });
      if (draw) {
        await api('/api/sites', {
          method: 'POST',
          body: JSON.stringify({ project_id: p.id, name: `${form.location_label.split(',')[0]}-01`, description: 'Initial project boundary.', geometry: draw.geometry })
        });
      }
      setStep(4);
      setTimeout(() => nav(`/projects/${p.id}`), 1400);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Creation failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm font-semibold opacity-70 hover:opacity-100"><ArrowLeft size={15} /> Back</button>
      <div><h1 className="font-display text-2xl sm:text-3xl font-extrabold">Create Project</h1><p className="text-sm opacity-60">Step {Math.min(step, 3)} of 3 — Basic info → Boundary → Review</p></div>

      <div className="flex gap-2">
        {[1, 2, 3].map((s) => <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-forest-600' : 'bg-forest-100 dark:bg-white/10'}`} />)}
      </div>

      {step === 4 ? (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={26} /></div>
          <h2 className="font-display mt-4 text-xl font-extrabold">Project created!</h2>
          <p className="text-sm opacity-60">Redirecting to project intelligence…</p>
        </motion.div>
      ) : (
        <div className="card p-6">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label">Project name</label><input className="input mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Western Ghats Restoration Phase II" /></div>
              <div><label className="label">Project type</label><select className="input mt-1" value={form.project_type} onChange={(e) => set('project_type', e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label className="label">Status</label><select className="input mt-1" value={form.status} onChange={(e) => set('status', e.target.value)}>{STATUS.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input mt-1 min-h-24" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Goals, interventions, partners…" /></div>
              <div><label className="label">Start date</label><input type="date" className="input mt-1" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></div>
              <div><label className="label">End date</label><input type="date" className="input mt-1" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} /></div>
              <div><label className="label">Location label</label><input className="input mt-1" value={form.location_label} onChange={(e) => set('location_label', e.target.value)} /></div>
              <div><label className="label">Project owner</label><input className="input mt-1" value={form.owner} onChange={(e) => set('owner', e.target.value)} /></div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm opacity-70">Draw the initial project boundary. Area is calculated automatically.</p>
              <DrawMap onChange={setDraw} />
              <div className="rounded-2xl bg-forest-800 p-4 text-center text-white">
                {draw ? <p className="font-display text-lg font-extrabold">Calculated Area: {draw.area_ha.toLocaleString()} hectares <span className="block text-xs font-medium opacity-70">{draw.perimeter_km} km perimeter · {draw.centroid_lat.toFixed(4)}°, {draw.centroid_lng.toFixed(4)}°</span></p>
                  : <p className="text-sm opacity-80">No polygon yet — draw on the map to calculate area.</p>}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3 text-sm">
              {[['Name', form.name], ['Type', form.project_type], ['Status', form.status], ['Location', form.location_label], ['Dates', `${form.start_date} → ${form.end_date}`], ['Boundary', draw ? `${draw.area_ha} ha · ${draw.perimeter_km} km` : 'No polygon (you can add sites later)']].map(([a, b]) => (
                <div key={a} className="flex justify-between gap-4 rounded-xl bg-forest-50 dark:bg-white/5 px-4 py-3"><span className="opacity-60">{a}</span><span className="text-right font-bold">{b || '—'}</span></div>
              ))}
              {projects.length > 0 && <p className="text-xs opacity-50">{projects.length} existing projects in workspace.</p>}
            </div>
          )}
          {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{err}</p>}
          <div className="mt-6 flex justify-between">
            <button className="btn-ghost text-sm" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button>
            {step < 3
              ? <button className="btn-primary text-sm" disabled={step === 1 && form.name.trim().length < 3} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={15} /></button>
              : <button className="btn-primary text-sm" disabled={busy || form.name.trim().length < 3} onClick={create}>{busy && <Loader2 className="animate-spin" size={16} />} Create Project</button>}
          </div>
        </div>
      )}
    </div>
  );
}
