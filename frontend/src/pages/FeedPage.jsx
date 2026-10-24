import React, { useState, useEffect } from 'react';
import FilterBar from '../components/FilterBar';
import ItemCard from '../components/ItemCard';
import { api } from '../services/api';
import { SearchX, Loader2, Sparkles } from 'lucide-react';

export default function FeedPage({ onSelectItem, onNavigate }) {
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

  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      status: 'active'
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* 1. Welcoming Hero Introduction */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 mb-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 flex flex-col items-start z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light text-primary-brand text-xs font-extrabold uppercase tracking-wider mb-4 border border-indigo-100">
              <Sparkles size={13} />
              <span>Campus Recovery Community</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-3">
              Lost something on campus?
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-xl font-normal">
              Connect with fellow students and faculty to quickly recover missing belongings. Report what you lost or found to receive instant AI tag suggestions and explainable candidate matches.
            </p>
          </div>

          {/* Right Hero Illustration */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-md lg:max-w-none rounded-2xl overflow-hidden p-2">
              <img 
                src="/hero-illustration.png" 
                alt="Connecting lost items with found items on campus"
                className="w-full h-auto max-h-64 object-contain mx-auto drop-shadow-sm transition-transform duration-500 hover:scale-[1.02]"
                onError={(e) => {
                  // Fallback to matching illustration if needed
                  e.currentTarget.src = '/matching-illustration.png';
                }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* 2. Structured Filter Section */}
      <FilterBar 
        filters={filters} 
        onFilterChange={setFilters} 
        onReset={handleResetFilters}
      />

      {/* 3. Items Grid Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 size={36} className="animate-spin text-primary-brand mb-3" />
          <p className="text-sm font-semibold">Loading campus items...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-700 max-w-lg mx-auto">
          <p className="font-bold text-base">Unable to connect to database</p>
          <p className="text-sm mt-1 text-red-600">{error}</p>
          <button 
            onClick={loadItems}
            className="mt-4 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <SearchX size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">No items match these filters</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
            Try adjusting your type, category, or status dropdowns above to explore more reports across campus.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-xs"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Showing {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} onClick={onSelectItem} />
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
