import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as CJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { LucideIcon } from 'lucide-react';
CJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function KpiCard({ icon: Icon, label, value, suffix = '', trend, spark, delay = 0 }: {
  icon: LucideIcon; label: string; value: number; suffix?: string; trend: string; spark: number[]; delay?: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now() + delay * 200; const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);
  const display = value >= 1000 ? n.toLocaleString('en-IN', { maximumFractionDigits: value % 1 ? 2 : 0 }) : n.toFixed(value % 1 ? 2 : 0);
  return (
    <div className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-800 text-white"><Icon size={19} /></div>
        <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">{trend}</span>
      </div>
      <p className="label mt-4">{label}</p>
      <p className="font-display text-3xl font-extrabold tracking-tight">{display}{suffix && <span className="text-base font-bold opacity-60"> {suffix}</span>}</p>
      <div className="mt-2 h-10">
        <Line data={{ labels: spark.map((_, i) => i), datasets: [{ data: spark, borderColor: '#1B7A4D', backgroundColor: 'rgba(27,122,77,.15)', fill: true, tension: 0.45, pointRadius: 0, borderWidth: 2 }] }}
          options={{ plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } }, animation: { duration: 600 }, maintainAspectRatio: false }} />
      </div>
    </div>
  );
}
