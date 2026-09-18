import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { ringMetrics } from '../lib/geo';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export type DrawResult = { geometry: { type: string; coordinates: number[][][] }; area_ha: number; perimeter_km: number; centroid_lat: number; centroid_lng: number };

export default function DrawMap({ onChange }: { onChange: (r: DrawResult | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (!ref.current) return;
    if (!TOKEN || TOKEN.includes('YOUR_MAPBOX')) {
      ref.current.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;background:#0e2a23;color:#fff;border-radius:16px;padding:20px;text-align:center;font-size:13px">Mapbox token missing — set <b>&nbsp;VITE_MAPBOX_TOKEN&nbsp;</b> to enable polygon drawing.</div>`;
      return;
    }
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({ container: ref.current, style: 'mapbox://styles/mapbox/satellite-streets-v12', center: [77.59, 12.97], zoom: 10 });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    const draw = new MapboxDraw({ displayControlsDefault: false, controls: { polygon: true, trash: true }, defaultMode: 'draw_polygon' });
    map.addControl(draw as never, 'top-left');
    const emit = () => {
      const feats = draw.getAll().features;
      if (!feats.length) { cb.current(null); return; }
      const g = feats[0].geometry as { type: string; coordinates: number[][][] };
      const m = ringMetrics(g.coordinates[0]);
      cb.current({ geometry: g, ...m });
    };
    map.on('draw.create', emit);
    map.on('draw.update', emit);
    map.on('draw.delete', () => cb.current(null));
    (window as unknown as { __ecoDrawReset?: () => void }).__ecoDrawReset = () => { draw.deleteAll(); cb.current(null); draw.changeMode('draw_polygon'); };
    return () => { map.remove(); };
  }, []);

  return (
    <div>
      <div ref={ref} style={{ height: 420, borderRadius: 16 }} className="w-full overflow-hidden" role="application" aria-label="Draw site polygon" />
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-forest-700/70 dark:text-white/60">
        <span className="rounded-lg bg-forest-50 dark:bg-white/5 px-2.5 py-1.5">① Click the polygon tool, then click on the map to draw</span>
        <span className="rounded-lg bg-forest-50 dark:bg-white/5 px-2.5 py-1.5">② Double-click to finish · drag points to edit</span>
        <button className="rounded-lg border px-2.5 py-1.5 hover:bg-forest-50 dark:hover:bg-white/10" onClick={() => (window as unknown as { __ecoDrawReset?: () => void }).__ecoDrawReset?.()}>Reset drawing</button>
      </div>
    </div>
  );
}
