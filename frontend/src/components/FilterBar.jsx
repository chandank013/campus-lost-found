import React from 'react';
import { Filter } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'bag', label: 'Bag' },
  { id: 'bottle', label: 'Bottle' },
  { id: 'phone', label: 'Phone' },
  { id: 'umbrella', label: 'Umbrella' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'book', label: 'Book' },
  { id: 'other', label: 'Other' },
];

export default function FilterBar({ filters, onFilterChange }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-col gap-3.5">
        {/* Top Filter Controls: Type and Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1">Type:</span>
            {['all', 'lost', 'found'].map((t) => (
              <button
                key={t}
                onClick={() => onFilterChange({ ...filters, type: t })}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  filters.type === t
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-text-muted hover:bg-slate-200'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1">Status:</span>
            {['active', 'returned', 'all'].map((s) => (
              <button
                key={s}
                onClick={() => onFilterChange({ ...filters, status: s })}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  filters.status === s
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-text-muted hover:bg-slate-200'
                }`}
              >
                {s === 'active' ? 'Active only' : s === 'returned' ? 'Returned' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm no-scrollbar">
          <Filter size={15} className="text-text-muted flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange({ ...filters, category: cat.id })}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filters.category === cat.id
                  ? 'bg-primary text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
