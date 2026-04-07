import { useState, useEffect } from 'react';
import { journalApi, type JournalEntry } from '../api/journal';

type FormState = { title: string; body: string; tags: string };

const emptyForm: FormState = { title: '', body: '', tags: '' };

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toTagArray(raw: string): string[] {
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

interface EntryFormProps {
  initial: FormState;
  submitting: boolean;
  error: string;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
  submitLabel: string;
}

function EntryForm({ initial, submitting, error, onSubmit, onCancel, submitLabel }: EntryFormProps) {
  const [form, setForm] = useState<FormState>(initial);

  const inputCls =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ' +
    'text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <input
        type="text"
        placeholder="Entry title (optional)"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        className={inputCls}
      />
      <textarea
        placeholder="What did you study or reflect on today?"
        rows={4}
        value={form.body}
        onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
        className={`${inputCls} resize-none`}
      />
      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={form.tags}
        onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
        className={inputCls}
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit(form)}
          disabled={submitting}
          className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 text-sm transition-colors"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newSubmitting, setNewSubmitting] = useState(false);
  const [newError, setNewError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    journalApi.getAll()
      .then(({ entries }) => setEntries(entries))
      .catch((err) => console.error('Failed to load journal:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (form: FormState) => {
    if (!form.body.trim()) { setNewError('Body is required'); return; }
    setNewSubmitting(true);
    setNewError('');
    try {
      const { entry } = await journalApi.create({
        title: form.title,
        body: form.body,
        tags: toTagArray(form.tags),
      });
      setEntries((prev) => [entry, ...prev]);
      setShowNew(false);
    } catch (err) {
      setNewError((err as Error).message ?? 'Could not save entry');
    } finally {
      setNewSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, form: FormState) => {
    if (!form.body.trim()) { setEditError('Body is required'); return; }
    setEditSubmitting(true);
    setEditError('');
    try {
      const { entry } = await journalApi.update(id, {
        title: form.title,
        body: form.body,
        tags: toTagArray(form.tags),
      });
      setEntries((prev) => prev.map((e) => (e._id === id ? entry : e)));
      setEditingId(null);
    } catch (err) {
      setEditError((err as Error).message ?? 'Could not update entry');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await journalApi.delete(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Journal</h1>
          {!showNew && (
            <button
              onClick={() => setShowNew(true)}
              className="text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 transition-colors"
            >
              + New entry
            </button>
          )}
        </div>

        {/* New entry form */}
        {showNew && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">New entry</h3>
            <EntryForm
              initial={emptyForm}
              submitting={newSubmitting}
              error={newError}
              onSubmit={handleCreate}
              onCancel={() => { setShowNew(false); setNewError(''); }}
              submitLabel="Save entry"
            />
          </div>
        )}

        {/* Entry list */}
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
            No journal entries yet.{' '}
            <button onClick={() => setShowNew(true)} className="text-indigo-500 hover:underline">
              Write your first one.
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) =>
              editingId === entry._id ? (
                <div
                  key={entry._id}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-indigo-300 dark:border-indigo-700 p-5"
                >
                  <EntryForm
                    initial={{
                      title: entry.title,
                      body: entry.body,
                      tags: entry.tags.join(', '),
                    }}
                    submitting={editSubmitting}
                    error={editError}
                    onSubmit={(form) => handleUpdate(entry._id, form)}
                    onCancel={() => { setEditingId(null); setEditError(''); }}
                    submitLabel="Save changes"
                  />
                </div>
              ) : (
                <div
                  key={entry._id}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {entry.title ? (
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {entry.title}
                        </h3>
                      ) : null}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingId(entry._id); setEditError(''); }}
                        className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <p
                    onClick={() => setExpandedId(expandedId === entry._id ? null : entry._id)}
                    className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap cursor-pointer ${
                      expandedId === entry._id ? '' : 'line-clamp-4'
                    }`}
                  >
                    {entry.body}
                  </p>

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
