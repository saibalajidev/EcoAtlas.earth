import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { STATUS_COLORS } from '../lib/geo';

export type MapSite = {
  id: string; project_id: string; name: string; project_name?: string; status: string;
  area_ha: number; carbon_estimate: number; centroid_lat: number; centroid_lng: number;
  geometry: { type: string; coordinates: number[][][] };
  created_at?: string;
};

type GeoResult = { id: string; place_name: string; center: [number, number] };

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export default function MapView({ sites, onSelect, flyTo, styleUrl, height = 520 }: {
  sites: MapSite[]; onSelect: (s: MapSite) => void; flyTo?: MapSite | null; styleUrl: string; height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);

  const searchPlace = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (q.trim().length < 3 || !TOKEN) return;
    setSearching(true);
    try {
      const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${TOKEN}&limit=5&country=in`);
      const j = await r.json();
      setResults(j.features || []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const goTo = (g: GeoResult) => {
    setResults([]); setQ(g.place_name);
    mapRef.current?.flyTo({ center: g.center, zoom: 10, duration: 1400 });
  };

  useEffect(() => {
    if (!ref.current) return;
    if (!TOKEN || TOKEN.includes('YOUR_MAPBOX')) {
      ref.current.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;flex-direction:column;gap:8px;background:linear-gradient(135deg,#0e2a23,#234e41);color:#fff;border-radius:16px;padding:24px;text-align:center"><b>Mapbox token missing</b><span style="opacity:.8;font-size:13px">Set VITE_MAPBOX_TOKEN in frontend/.env — see README “Mapbox setup”.</span></div>`;
      return;
    }
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({ container: ref.current, style: styleUrl, center: [78.5, 15.5], zoom: 4.2, attributionControl: false });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('sites', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'sites-fill', type: 'fill', source: 'sites', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.45 } });
      map.addLayer({ id: 'sites-line', type: 'line', source: 'sites', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } });
      // Clustered site centroids (declutter at low zoom; polygons stay authoritative)
      try {
        map.addSource('centroids', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterMaxZoom: 9, clusterRadius: 48 } as never);
        map.addLayer({ id: 'clusters', type: 'circle', source: 'centroids', filter: ['has', 'point_count'],
          paint: { 'circle-color': '#0e2a23', 'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 30, 28], 'circle-opacity': 0.85, 'circle-stroke-width': 2, 'circle-stroke-color': '#e8b44a' } });
        map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'centroids', filter: ['has', 'point_count'],
          layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 11 }, paint: { 'text-color': '#ffffff' } });
        map.on('click', 'clusters', (e) => {
          const f = e.features?.[0] as unknown as { properties: { cluster_id: number } } | undefined;
          const id = f?.properties.cluster_id;
          if (id == null) return;
          const src = map.getSource('centroids') as unknown as {
            getClusterExpansionZoom: (cid: number, cb: (err: unknown, z: number | undefined) => void) => void
          };
          src.getClusterExpansionZoom(id, (err, z) => {
            if (!err) map.easeTo({ center: e.lngLat, zoom: z ?? 10 });
          });
        });
      } catch { /* clustering optional — map works without it */ }
      map.on('mousemove', 'sites-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const f = (e.features?.[0] as unknown as { properties: { name: string; project: string; area: number; carbon: number; status: string } } | undefined);
        if (!f) return;
        const p = f.properties;
        new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
          .setLngLat(e.lngLat)
          .setHTML(`<b>${p.name}</b><br/>${p.project}<br/>${p.area} ha · ${p.carbon} tCO₂e · ${p.status}`)
          .addTo(map);
        setTimeout(() => document.querySelectorAll('.mapboxgl-popup').forEach((el) => el.remove()), 2200);
      });
      map.on('click', 'sites-fill', (e) => {
        const f = e.features?.[0] as unknown as { properties: { site: MapSite } } | undefined;
        if (f) selectRef.current(f.properties.site);
      });
      refresh(map);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, [styleUrl]);

  const refresh = (map?: mapboxgl.Map) => {
    const m = map || mapRef.current;
    if (!m || !m.getSource('sites')) return;
    const fc = {
      type: 'FeatureCollection',
      features: sites.filter((s) => s.geometry?.coordinates?.length).map((s) => ({
        type: 'Feature',
        geometry: s.geometry,
        properties: {
          color: STATUS_COLORS[s.status] || '#1B7A4D',
          name: s.name, project: s.project_name || '', area: s.area_ha,
          carbon: s.carbon_estimate, status: s.status, site: s
        }
      }))
    };
    (m.getSource('sites') as mapboxgl.GeoJSONSource).setData(fc as never);
    try {
      const pts = {
        type: 'FeatureCollection',
        features: sites.filter((s) => s.centroid_lat && s.centroid_lng).map((s) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.centroid_lng, s.centroid_lat] },
          properties: { id: s.id }
        }))
      };
      (m.getSource('centroids') as mapboxgl.GeoJSONSource)?.setData(pts as never);
    } catch { /* noop */ }
    if (sites.length) {
      const b = new mapboxgl.LngLatBounds();
      sites.forEach((s) => s.geometry.coordinates[0].forEach(([lng, lat]) => b.extend([lng, lat])));
      try { m.fitBounds(b, { padding: 40, maxZoom: 9, duration: 800 }); } catch { /* noop */ }
    }
  };

  useEffect(() => { refresh(); }, [sites]);

  useEffect(() => {
    const m = mapRef.current;
    if (m && flyTo?.geometry) {
      const b = new mapboxgl.LngLatBounds();
      flyTo.geometry.coordinates[0].forEach(([lng, lat]) => b.extend([lng, lat]));
      m.flyTo({ center: b.getCenter(), zoom: 9, duration: 1200 });
    }
  }, [flyTo]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height, borderRadius: 16 }}>
      <div ref={ref} style={{ height: '100%' }} className="w-full" role="application" aria-label="Project sites map" />
      {TOKEN && !TOKEN.includes('YOUR_MAPBOX') && (
        <div className="absolute left-3 top-3 z-10 w-64 max-w-[70%]">
          <form onSubmit={searchPlace} className="flex overflow-hidden rounded-xl bg-white/95 dark:bg-forest-950/95 shadow-soft backdrop-blur">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search location…" aria-label="Search map location"
              className="w-full bg-transparent px-3 py-2 text-xs outline-none" />
            <button className="px-3 text-xs font-bold text-forest-700 dark:text-emerald-300" aria-label="Search">{searching ? '…' : 'Go'}</button>
          </form>
          {results.length > 0 && (
            <ul className="mt-1 overflow-hidden rounded-xl bg-white dark:bg-forest-950 shadow-soft">
              {results.map((g) => (
                <li key={g.id}><button onClick={() => goTo(g)} className="block w-full truncate px-3 py-2 text-left text-xs hover:bg-forest-50 dark:hover:bg-white/10">{g.place_name}</button></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
