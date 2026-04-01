'use client';

import { useState } from 'react';
import { Expense, SortField, SortDirection } from '../types/expense';
import { formatCurrency, formatDate, CATEGORY_BG } from '../lib/utils';
import { Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface Props {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, onEdit, onDelete }: Props) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const sorted = [...expenses].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') cmp = a.date.localeCompare(b.date);
    else if (sortField === 'amount') cmp = a.amount - b.amount;
    else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-gray-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="text-violet-500" />
    ) : (
      <ChevronDown size={12} className="text-violet-500" />
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-gray-400 text-sm">No expenses found.</p>
        <p className="text-gray-300 text-xs mt-1">Add your first expense above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="hidden sm:grid grid-cols-[1fr_120px_140px_120px_80px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <span>Description</span>
        <button
          onClick={() => handleSort('category')}
          className="flex items-center gap-1 hover:text-gray-700"
        >
          Category <SortIcon field="category" />
        </button>
        <button
          onClick={() => handleSort('date')}
          className="flex items-center gap-1 hover:text-gray-700"
        >
          Date <SortIcon field="date" />
        </button>
        <button
          onClick={() => handleSort('amount')}
          className="flex items-center gap-1 justify-end hover:text-gray-700 ml-auto"
        >
          Amount <SortIcon field="amount" />
        </button>
        <span></span>
      </div>

      {/* Rows */}
      <ul className="divide-y divide-gray-50">
        {sorted.map((expense) => (
          <li key={expense.id} className="group">
            {/* Desktop row */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_140px_120px_80px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-800 font-medium truncate">
                {expense.description}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                  CATEGORY_BG[expense.category]
                }`}
              >
                {expense.category}
              </span>
              <span className="text-sm text-gray-500">{formatDate(expense.date)}</span>
              <span className="text-sm font-semibold text-gray-900 text-right">
                {formatCurrency(expense.amount)}
              </span>
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(expense)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                {deleteConfirm === expense.id ? (
                  <button
                    onClick={() => {
                      onDelete(expense.id);
                      setDeleteConfirm(null);
                    }}
                    className="px-2 py-1 rounded-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(expense.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile row */}
            <div className="sm:hidden px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        CATEGORY_BG[expense.category]
                      }`}
                    >
                      {expense.category}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(expense.amount)}
                  </span>
                  <button onClick={() => onEdit(expense)} className="p-1 text-gray-400">
                    <Pencil size={13} />
                  </button>
                  {deleteConfirm === expense.id ? (
                    <button
                      onClick={() => {
                        onDelete(expense.id);
                        setDeleteConfirm(null);
                      }}
                      className="px-2 py-0.5 rounded text-xs text-white bg-red-500"
                    >
                      Del?
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(expense.id)}
                      className="p-1 text-gray-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
        </span>
        <span className="text-sm font-semibold text-gray-900">
          Total: {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}
        </span>
      </div>
    </div>
  );
}
