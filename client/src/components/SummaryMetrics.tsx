import type { Item } from '../api/items';

interface Props {
  items: Item[];
}

export default function SummaryMetrics({ items }: Props) {
  const total = items.length;
  const done = items.filter((i) => i.status === 'done').length;
  const totalHours = items.reduce((sum, i) => sum + (i.hours ?? 0), 0);
  const avgProgress =
    total > 0 ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / total) : 0;

  const stats = [
    { label: 'Total items', value: total },
    { label: 'Completed', value: done },
    { label: 'Avg. progress', value: `${avgProgress}%` },
    { label: 'Hours logged', value: totalHours.toFixed(1) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-4"
        >
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
