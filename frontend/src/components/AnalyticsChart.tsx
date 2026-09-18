import { Line } from 'react-chartjs-2';
import { Chart as CJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
CJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function AnalyticsChart({ labels, datasets, height = 280 }: {
  labels: string[]; height?: number;
  datasets: { label: string; data: number[]; color: string; fill?: boolean }[];
}) {
  return (
    <div style={{ height }}>
      <Line
        data={{ labels, datasets: datasets.map((d) => ({ label: d.label, data: d.data, borderColor: d.color, backgroundColor: d.color + '22', fill: !!d.fill, tension: 0.4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2.5 })) }}
        options={{
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { backgroundColor: '#0e2a23', padding: 10, cornerRadius: 10 } },
          scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: 'rgba(120,140,130,.15)' }, ticks: { font: { size: 10 } } } }
        }}
      />
    </div>
  );
}
