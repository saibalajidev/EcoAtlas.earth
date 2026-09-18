import { ReactNode } from 'react';
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    Monitoring: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    Completed: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
    'At Risk': 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
  };
  return <span className={`badge ${map[status] || map.Active}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}
export function EmptyState({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-50 dark:bg-white/5 text-2xl">🌿</div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-forest-700/70 dark:text-white/60">{sub}</p>
      {action}
    </div>
  );
}
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-forest-100/70 dark:bg-white/10 ${className}`} />;
}
