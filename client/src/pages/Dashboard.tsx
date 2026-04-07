import { useState, useEffect } from 'react';
import { itemsApi, type Item } from '../api/items';
import { type Platform } from '../schemas';
import ItemCard from '../components/ItemCard';
import AddItemForm from '../components/AddItemForm';
import GoalsPanel from '../components/GoalsPanel';
import NotesFeed from '../components/NotesFeed';
import SummaryMetrics from '../components/SummaryMetrics';
import PlatformFilter from '../components/PlatformFilter';

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<Platform | 'All'>('All');
  const [showAddForm, setShowAddForm] = useState(false);

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

  const filteredItems =
    platformFilter === 'All' ? items : items.filter((i) => i.platform === platformFilter);

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const handleCreated = (item: Item) => {
    setItems((prev) => [item, ...prev]);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Summary metrics */}
        <SummaryMetrics items={items} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: item list */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Learning Items
              </h2>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 transition-colors"
              >
                {showAddForm ? 'Cancel' : '+ Add item'}
              </button>
            </div>

            {showAddForm && (
              <AddItemForm onCreated={handleCreated} onCancel={() => setShowAddForm(false)} />
            )}

            <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />

            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                No items yet.{' '}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-indigo-500 hover:underline"
                >
                  Add your first one.
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <ItemCard key={item._id} item={item} onDeleted={handleDeleted} />
                ))}
              </div>
            )}
          </section>

          {/* Right: goals + notes */}
          <aside className="space-y-6">
            <GoalsPanel items={items} />
            <NotesFeed items={items} />
          </aside>
        </div>
      </div>
    </div>
  );
}
