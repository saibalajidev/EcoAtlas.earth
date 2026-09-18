// Client-side polygon metrics (mirrors backend) + formatting helpers.
export function ringMetrics(ring: number[][]) {
  if (!ring || ring.length < 4) return { area_ha: 0, perimeter_km: 0, centroid_lat: 0, centroid_lng: 0 };
  const lats = ring.map((p) => p[1]);
  const lat0 = lats.reduce((a, b) => a + b, 0) / lats.length;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110540;
  const pts = ring.map(([lng, lat]) => [lng * kx, lat * ky]);
  let area = 0;
  for (let i = 0; i < pts.length - 1; i++) area += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
  area = Math.abs(area) / 2;
  let per = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [a1, b1] = ring[i]; const [a2, b2] = ring[i + 1];
    const mx = (a2 - a1) * 111320 * Math.cos((((b1 + b2) / 2) * Math.PI) / 180);
    const my = (b2 - b1) * 110540;
    per += Math.hypot(mx, my);
  }
  const n = ring.length - 1;
  return {
    area_ha: Math.round((area / 10000) * 10) / 10,
    perimeter_km: Math.round((per / 1000) * 100) / 100,
    centroid_lat: +((ring.slice(0, n).reduce((a, p) => a + p[1], 0) / n).toFixed(6)),
    centroid_lng: +((ring.slice(0, n).reduce((a, p) => a + p[0], 0) / n).toFixed(6))
  };
}

export const fmt = (n: number) => n.toLocaleString('en-IN');
export const fmtCompact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

export const STATUS_COLORS: Record<string, string> = {
  Active: '#1B7A4D',
  Monitoring: '#C98A1B',
  Completed: '#3B82F6',
  'At Risk': '#DC2626'
};
