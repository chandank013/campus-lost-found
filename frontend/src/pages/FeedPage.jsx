import React, { useState, useEffect } from 'react';
import FilterBar from '../components/FilterBar';
import ItemCard from '../components/ItemCard';
import { api } from '../services/api';
import { SearchX, Loader2 } from 'lucide-react';

export default function FeedPage({ onSelectItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'active'
  });

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getItems(filters);
      setItems(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [filters]);

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      status: 'active'
    });
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Intro Subtitle */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-text-main">Campus Recovery Board</h2>
        <p className="text-sm text-text-muted mt-1">
          Browse reported lost and found items. Report what you lost or found to see instant match suggestions.
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onFilterChange={setFilters} />

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted">
          <Loader2 size={36} className="animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Loading campus items...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold">Unable to connect to database</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={loadItems}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-xs flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-text-muted flex items-center justify-center mb-4">
            <SearchX size={28} />
          </div>
          <h3 className="text-lg font-bold text-text-main">No items match these filters</h3>
          <p className="text-sm text-text-muted max-w-sm mt-1 mb-5">
            Try adjusting your type, category, or status filters to see more results from around campus.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} onClick={onSelectItem} />
          ))}
        </div>
      )}
    </main>
  );
}
