import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as CJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';
import { StatusBadge } from './ui';
import type { MapSite } from './MapView';
CJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export default function SiteDrawer({ site, onClose }: { site: MapSite | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {site && (
        <motion.aside initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-4 top-20 z-40 w-[340px] max-w-[calc(100vw-2rem)] card p-5" role="dialog" aria-label="Site details">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-500">{site.project_name}</p>
              <h3 className="font-display text-lg font-extrabold">{site.name}</h3>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-forest-50 dark:hover:bg-white/10" aria-label="Close"><X size={17} /></button>
          </div>
          <div className="mt-2"><StatusBadge status={site.status} /></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-3"><dt className="label">Area</dt><dd className="font-bold">{site.area_ha.toLocaleString()} ha</dd></div>
            <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-3"><dt className="label">Carbon</dt><dd className="font-bold">{site.carbon_estimate.toLocaleString()} tCO₂e</dd></div>
            <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-3"><dt className="label">Center</dt><dd className="font-bold text-xs">{site.centroid_lat.toFixed(4)}°, {site.centroid_lng.toFixed(4)}°</dd></div>
            <div className="rounded-xl bg-forest-50 dark:bg-white/5 p-3"><dt className="label">Demo trend</dt><dd className="font-bold text-emerald-600">+8.4%</dd></div>
          </dl>
          <div className="mt-3 h-24">
            <Line data={{ labels: ['J', 'F', 'M', 'A', 'M', 'J'], datasets: [{ data: [40, 48, 52, 61, 70, 78], borderColor: '#1B7A4D', tension: 0.45, pointRadius: 0 }] }}
              options={{ plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } }, maintainAspectRatio: false }} />
          </div>
          <div className="mt-4 flex gap-2">
            <Link to={`/sites/${site.id}`} className="btn-primary flex-1 text-sm">View Analytics <ArrowRight size={15} /></Link>
            <Link to={`/sites/${site.id}`} className="btn-ghost text-sm" aria-label="Edit site"><Pencil size={15} /></Link>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
