import type { Item } from '../api/items';

interface Props {
  items: Item[];
}

export default function NotesFeed({ items }: Props) {
  const notes = items
    .filter((i) => i.note && i.note.trim().length > 0)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">
        📝 Recent notes
      </h3>

      {notes.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((item) => (
            <li key={item._id} className="border-l-2 border-indigo-200 dark:border-indigo-700 pl-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {item.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {item.note}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
