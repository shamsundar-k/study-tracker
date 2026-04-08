import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsApi, type Item } from '../api/items';
import type { Platform, ItemStatus, Priority } from '../schemas';

interface Props {
  item: Item;
  onDeleted: (id: string) => void;
  onUpdated: (item: Item) => void;
}

// ── Badge colours ─────────────────────────────────────────────────────────────
function platformBadge(platform: string): string {
  switch (platform) {
    case 'Coursera':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case "O'Reilly":
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    case 'Frontend Masters':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'Udemy':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300';
    case 'YouTube':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function statusBadge(status: ItemStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'paused':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    case 'done':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
  }
}

function priorityBadge(priority: Priority): { cls: string; label: string } {
  switch (priority) {
    case 'high':   return { cls: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',         label: 'High' };
    case 'medium': return { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', label: 'Med' };
    case 'low':    return { cls: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Low' };
  }
}

function progressBarColor(status: ItemStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'paused':
      return 'bg-amber-400';
    case 'done':
      return 'bg-blue-500';
  }
}

export default function ItemCard({ item, onDeleted, onUpdated }: Props) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    setDeleting(true);
    try {
      await itemsApi.delete(item._id);
      onDeleted(item._id);
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleting(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const { item: updated } = await itemsApi.update(item._id, { archived: !item.archived });
      onUpdated(updated);
    } catch (err) {
      console.error('Archive failed:', err);
    } finally {
      setArchiving(false);
    }
  };

  const deadlineStr = item.deadline
    ? new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${platformBadge(item.platform)}`}>
              {item.platform}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {item.type}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(item.status)}`}>
              {item.status}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityBadge(item.priority).cls}`}>
              {priorityBadge(item.priority).label}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!item.archived && (
            <button
              onClick={() => navigate(`/items/${item._id}/edit`)}
              className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
              title="Edit"
            >
              ✏️
            </button>
          )}
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="text-xs text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors disabled:opacity-40"
            title={item.archived ? 'Unarchive' : 'Archive'}
          >
            {item.archived ? '📤' : '📥'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-40"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{item.progress}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${progressBarColor(item.status)}`}
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
        {item.hours !== undefined && <span>{item.hours}h logged</span>}
        {deadlineStr && <span>Due {deadlineStr}</span>}
        {item.completedAt && (
          <span className="text-blue-500 dark:text-blue-400">
            Completed {new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Note */}
      {item.note && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2 border-t border-gray-50 dark:border-gray-800 pt-2">
          {item.note}
        </p>
      )}
    </div>
  );
}
