import { platforms, type Platform } from '../schemas';

interface Props {
  value: Platform | 'All';
  onChange: (value: Platform | 'All') => void;
}

export default function PlatformFilter({ value, onChange }: Props) {
  const options: (Platform | 'All')[] = ['All', ...platforms];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === p
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
