import React from 'react';
import { LayoutGrid, Tag, Layers, ChevronDown, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'bag', label: 'Bags & Backpacks' },
  { id: 'bottle', label: 'Bottles' },
  { id: 'phone', label: 'Phones' },
  { id: 'umbrella', label: 'Umbrellas' },
  { id: 'laptop', label: 'Laptops' },
  { id: 'book', label: 'Books' },
  { id: 'other', label: 'Other Items' },
];

export default function FilterBar({ filters, onFilterChange, onReset }) {
  const isFiltered = filters.type !== 'all' || filters.category !== 'all' || (filters.status !== 'all' && filters.status !== 'active');

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Type Dropdown */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Type
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
              <LayoutGrid size={18} />
            </div>
            <select
              value={filters.type}
              onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all appearance-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">All Types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* 2. Category Dropdown */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Category
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
              <Tag size={18} />
            </div>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all appearance-none cursor-pointer hover:border-slate-300"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* 3. Status Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Status
            </label>
            {isFiltered && (
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1 text-[11px] font-bold text-primary-brand hover:underline"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
              <Layers size={18} />
            </div>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-brand/20 focus:border-primary-brand transition-all appearance-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
