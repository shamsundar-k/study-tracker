import { useState, useEffect } from 'react';
import { itemsApi, type Item } from '../api/items';
import { type Platform } from '../schemas';
import ItemCard from '../components/ItemCard';
import AddItemForm from '../components/AddItemForm';
import GoalsPanel from '../components/GoalsPanel';
import NotesFeed from '../components/NotesFeed';
import SummaryMetrics from '../components/SummaryMetrics';
import PlatformFilter from '../components/PlatformFilter';

type Tab = 'active' | 'archived';

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<Platform | 'All'>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [tab, setTab] = useState<Tab>('active');

  const fetchItems = async () => {
    try {
      const { items } = await itemsApi.getAll();
      setItems(items);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const handleCreated = (item: Item) => {
    setItems((prev) => [item, ...prev]);
    setShowAddForm(false);
  };

  const handleUpdated = (updated: Item) => {
    setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
  };

  const tabItems = tab === 'active'
    ? items.filter((i) => !i.archived)
    : items.filter((i) => i.archived);

  const filteredItems =
    platformFilter === 'All' ? tabItems : tabItems.filter((i) => i.platform === platformFilter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Summary metrics */}
        <SummaryMetrics items={items.filter((i) => !i.archived)} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: item list */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Learning Items
              </h2>
              {tab === 'active' && (
                <button
                  onClick={() => setShowAddForm((v) => !v)}
                  className="text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 transition-colors"
                >
                  {showAddForm ? 'Cancel' : '+ Add item'}
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
              {(['active', 'archived'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setShowAddForm(false); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t}
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                    ({(t === 'active' ? items.filter((i) => !i.archived) : items.filter((i) => i.archived)).length})
                  </span>
                </button>
              ))}
            </div>

            {showAddForm && (
              <AddItemForm onCreated={handleCreated} onCancel={() => setShowAddForm(false)} />
            )}

            <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />

            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                {tab === 'active' ? (
                  <>
                    No items yet.{' '}
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="text-indigo-500 hover:underline"
                    >
                      Add your first one.
                    </button>
                  </>
                ) : (
                  'No archived items.'
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    onDeleted={handleDeleted}
                    onUpdated={handleUpdated}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Right: goals + notes */}
          <aside className="space-y-6">
            <GoalsPanel items={items.filter((i) => !i.archived)} />
            <NotesFeed items={items.filter((i) => !i.archived)} />
          </aside>
        </div>
      </div>
    </div>
  );
}
