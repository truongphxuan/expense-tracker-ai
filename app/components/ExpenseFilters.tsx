'use client';

import { Filters, Category } from '../types/expense';
import { CATEGORIES } from '../lib/utils';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function ExpenseFilters({ filters, onChange }: Props) {
  function set(field: keyof Filters, value: string) {
    onChange({ ...filters, [field]: value });
  }

  function clearFilters() {
    onChange({ search: '', category: 'All', dateFrom: '', dateTo: '' });
  }

  const hasActiveFilters =
    filters.search || filters.category !== 'All' || filters.dateFrom || filters.dateTo;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={14} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Search expenses…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50"
          />
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => set('category', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50 text-gray-700"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Date From */}
        <div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50 text-gray-700"
          />
        </div>

        {/* Date To */}
        <div>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50 text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}
