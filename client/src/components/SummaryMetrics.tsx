import type { Item } from '../api/items';

interface Props {
  items: Item[];
  allItems?: Item[];
  weeklyGoal?: number;
}

export default function SummaryMetrics({ items, allItems, weeklyGoal }: Props) {
  const total = items.length;
  const done = items.filter((i) => i.status === 'done').length;
  const totalHours = items.reduce((sum, i) => sum + (i.hours ?? 0), 0);
  const avgProgress =
    total > 0 ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / total) : 0;

  // This week = Monday 00:00 → now
  // Use allItems so archived items still count toward the weekly goal
  const weeklyItems = allItems ?? items;
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const weeklyHours = weeklyItems
    .filter((i) => new Date(i.updatedAt) >= monday)
    .reduce((sum, i) => sum + (i.hours ?? 0), 0);

  const showWeekly = weeklyGoal && weeklyGoal > 0;
  const weeklyPct = showWeekly ? Math.min(100, Math.round((weeklyHours / weeklyGoal!) * 100)) : 0;

  const stats = [
    { label: 'Total items', value: total },
    { label: 'Completed', value: done },
    { label: 'Avg. progress', value: `${avgProgress}%` },
    { label: 'Hours logged', value: totalHours.toFixed(1) },
  ];

  return (
    <div className={`grid gap-4 ${showWeekly ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-4"
        >
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
        </div>
      ))}

      {showWeekly && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {weeklyHours.toFixed(1)}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500"> / {weeklyGoal}h</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This week</p>
          <div className="mt-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${weeklyPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
