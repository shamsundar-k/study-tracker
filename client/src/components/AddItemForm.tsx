import { useState } from 'react';
import { itemsApi, type Item } from '../api/items';
import { itemCreateSchema, platforms, itemStatuses, platformTypeMap, type ItemCreateInput } from '../schemas';
import { useForm } from '../hooks/useForm';

interface Props {
  onCreated: (item: Item) => void;
  onCancel: () => void;
}

export default function AddItemForm({ onCreated, onCancel }: Props) {
  const [serverError, setServerError] = useState('');

  const { values, errors, handleChange, handleSubmit, submitting, setValues } =
    useForm<ItemCreateInput>({
      schema: itemCreateSchema,
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
        const { item } = await itemsApi.create(data);
        onCreated(item);
      },
      onError: (err) => {
        setServerError((err as Error).message ?? 'Could not create item');
      },
    });

  // When platform changes, reset type to the first valid option
  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const platform = e.target.value as ItemCreateInput['platform'];
    setValues((prev) => ({
      ...prev,
      platform,
      type: platformTypeMap[platform][0],
    }));
  };

  const availableTypes = platformTypeMap[values.platform];

  const inputCls =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">New learning item</h3>

      {serverError && (
        <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Name */}
        <div>
          <label className={labelCls}>Name *</label>
          <input
            type="text"
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="e.g. React — The Complete Guide"
            className={inputCls}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Platform + Type row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Platform *</label>
            <select name="platform" value={values.platform} onChange={handlePlatformChange} className={inputCls}>
              {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Type *</label>
            <select name="type" value={values.type} onChange={handleChange} className={inputCls}>
              {availableTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
          </div>
        </div>

        {/* Progress + Status row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Progress: {values.progress}%</label>
            <input
              type="range"
              name="progress"
              min={0}
              max={100}
              value={values.progress}
              onChange={handleChange}
              className="w-full mt-2 accent-indigo-600"
            />
          </div>
          <div>
            <label className={labelCls}>Status *</label>
            <select name="status" value={values.status} onChange={handleChange} className={inputCls}>
              {itemStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Hours + Deadline row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Hours logged</label>
            <input
              type="number"
              name="hours"
              min={0}
              step={0.5}
              value={values.hours ?? ''}
              onChange={handleChange}
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
          <label className={labelCls}>Tags (comma-separated)</label>
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
        </div>

        {/* Note */}
        <div>
          <label className={labelCls}>Key learnings</label>
          <textarea
            name="note"
            rows={2}
            value={values.note ?? ''}
            onChange={handleChange}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 text-sm transition-colors"
          >
            {submitting ? 'Adding…' : 'Add item'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
