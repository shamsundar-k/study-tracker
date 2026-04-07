import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsApi, type Item } from '../api/items';
import {
  itemUpdateSchema,
  platforms,
  itemTypes,
  itemStatuses,
  platformTypeMap,
  type ItemUpdateInput,
} from '../schemas';
import { useForm } from '../hooks/useForm';

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  const { values, errors, handleChange, handleSubmit, submitting, setValues } =
    useForm<ItemUpdateInput>({
      schema: itemUpdateSchema,
      initial: {
        name: '',
        platform: 'Coursera',
        type: 'Course',
        progress: 0,
        status: 'active',
        tags: [],
        hours: undefined,
        deadline: '',
        note: '',
      },
      onSubmit: async (data) => {
        if (!id) return;
        await itemsApi.update(id, data);
        navigate('/');
      },
      onError: (err) => {
        setServerError((err as Error).message ?? 'Update failed');
      },
    });

  useEffect(() => {
    itemsApi.getAll().then(({ items }) => {
      const found = items.find((i) => i._id === id) ?? null;
      setItem(found);
      setLoading(false);
    });
  }, [id]);

  // Populate form once item is loaded
  useEffect(() => {
    if (item) {
      setValues({
        name: item.name,
        platform: item.platform,
        type: item.type,
        progress: item.progress,
        hours: item.hours,
        deadline: item.deadline ? item.deadline.split('T')[0] : '',
        status: item.status,
        tags: item.tags,
        note: item.note ?? '',
      });
    }
  }, [item, setValues]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-sm text-red-500">Item not found.</p>
      </div>
    );
  }

  const availableTypes = values.platform ? platformTypeMap[values.platform] : itemTypes;

  const inputCls =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ' +
    'text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 ' +
    'focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors';

  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const fieldErrCls = 'mt-1 text-xs text-red-500 dark:text-red-400';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Edit item
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">
              {item.name}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900
                       dark:hover:text-gray-100 transition-colors"
          >
            <span>←</span> Back
          </button>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border
                        border-gray-200 dark:border-gray-800 p-8 space-y-6">

          {serverError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200
                            dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* Name */}
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                name="name"
                value={values.name ?? ''}
                onChange={handleChange}
                placeholder="e.g. React — The Complete Guide"
                className={inputCls}
              />
              {errors.name && <p className={fieldErrCls}>{errors.name}</p>}
            </div>

            {/* Platform + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Platform</label>
                <select
                  name="platform"
                  value={values.platform ?? ''}
                  onChange={handleChange}
                  className={inputCls}
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select
                  name="type"
                  value={values.type ?? ''}
                  onChange={handleChange}
                  className={inputCls}
                >
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.type && <p className={fieldErrCls}>{errors.type}</p>}
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls + ' mb-0'}>Progress</label>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {values.progress ?? 0}%
                </span>
              </div>
              <input
                type="range"
                name="progress"
                min={0}
                max={100}
                value={values.progress ?? 0}
                onChange={handleChange}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              {/* Track labels */}
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={labelCls}>Status</label>
              <div className="flex gap-3">
                {itemStatuses.map((s) => {
                  const active = values.status === s;
                  const colour =
                    s === 'active'
                      ? active
                        ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-400 dark:hover:border-green-600'
                      : s === 'paused'
                      ? active
                        ? 'bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-amber-400 dark:hover:border-amber-600'
                      : active
                        ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600';

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValues((prev) => ({ ...prev, status: s }))}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium capitalize
                                  transition-colors ${colour}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hours + Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Hours logged</label>
                <input
                  type="number"
                  name="hours"
                  min={0}
                  step={0.5}
                  value={values.hours ?? ''}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={values.deadline ?? ''}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelCls}>Tags</label>
              <input
                type="text"
                placeholder="React, TypeScript, Hooks"
                value={(values.tags ?? []).join(', ')}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  }))
                }
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Separate tags with commas
              </p>
            </div>

            {/* Note */}
            <div>
              <label className={labelCls}>Key learnings</label>
              <textarea
                name="note"
                value={values.note ?? ''}
                onChange={handleChange}
                rows={4}
                placeholder="What did you learn? Any key takeaways…"
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50
                           text-white font-medium py-2.5 text-sm transition-colors"
              >
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                           font-medium py-2.5 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
