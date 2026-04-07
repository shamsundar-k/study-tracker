import type { Item } from '../api/items';

interface Props {
  items: Item[];
}

export default function GoalsPanel({ items }: Props) {
  const goals = items
    .filter((i) => i.status !== 'done' && i.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">
        🎯 Upcoming goals
      </h3>

      {goals.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          No goals with deadlines yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {goals.map((item) => {
            const deadline = new Date(item.deadline!);
            const daysLeft = Math.ceil(
              (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            const overdue = daysLeft < 0;

            return (
              <li key={item._id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {item.name}
                  </p>
                  <p className={`text-xs mt-0.5 ${overdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {overdue
                      ? `${Math.abs(daysLeft)}d overdue`
                      : daysLeft === 0
                        ? 'Due today'
                        : `${daysLeft}d left`}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {item.progress}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
