import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsApi, type Item } from '../api/items';
import { itemUpdateSchema, platforms, itemTypes, itemStatuses, platformTypeMap, type ItemUpdateInput } from '../schemas';
import { useForm } from '../hooks/useForm';

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    itemsApi.getAll().then(({ items }) => {
      const found = items.find((i) => i._id === id);
      setItem(found ?? null);
      setLoading(false);
    });
  }, [id]);

  const { values, errors, handleChange, handleSubmit, submitting, setValues } = useForm<ItemUpdateInput>({
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

  if (loading) return <p className="p-8 text-gray-500">Loading…</p>;
  if (!item) return <p className="p-8 text-red-500">Item not found.</p>;

  const availableTypes = values.platform ? platformTypeMap[values.platform] : itemTypes;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit item</h1>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Back
          </button>
        </div>

        {serverError && (
          <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              name="name"
              value={values.name ?? ''}
              onChange={handleChange}
              className="input"
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          {/* Platform */}
          <div>
            <label className="label">Platform</label>
            <select name="platform" value={values.platform ?? ''} onChange={handleChange} className="input">
              {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="label">Type</label>
            <select name="type" value={values.type ?? ''} onChange={handleChange} className="input">
              {availableTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.type && <p className="field-error">{errors.type}</p>}
          </div>

          {/* Progress */}
          <div>
            <label className="label">Progress ({values.progress ?? 0}%)</label>
            <input
              type="range"
              name="progress"
              min={0}
              max={100}
              value={values.progress ?? 0}
              onChange={handleChange}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Hours */}
          <div>
            <label className="label">Hours logged</label>
            <input
              type="number"
              name="hours"
              min={0}
              step={0.5}
              value={values.hours ?? ''}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="label">Deadline</label>
            <input
              type="date"
              name="deadline"
              value={values.deadline ?? ''}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select name="status" value={values.status ?? 'active'} onChange={handleChange} className="input">
              {itemStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={(values.tags ?? []).join(', ')}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                }))
              }
              className="input"
            />
          </div>

          {/* Note */}
          <div>
            <label className="label">Key learnings</label>
            <textarea
              name="note"
              value={values.note ?? ''}
              onChange={handleChange}
              rows={3}
              className="input resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 text-sm transition-colors"
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
