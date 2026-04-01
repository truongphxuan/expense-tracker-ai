'use client';

import { useState, useEffect } from 'react';
import { ExpenseFormData, Expense, Category } from '../types/expense';
import { CATEGORIES } from '../lib/utils';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface Props {
  onSubmit: (data: ExpenseFormData) => void;
  onClose: () => void;
  editing?: Expense | null;
}

const DEFAULT_FORM: ExpenseFormData = {
  date: format(new Date(), 'yyyy-MM-dd'),
  amount: '',
  category: 'Food',
  description: '',
};

export default function ExpenseForm({ onSubmit, onClose, editing }: Props) {
  const [form, setForm] = useState<ExpenseFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});

  useEffect(() => {
    if (editing) {
      setForm({
        date: editing.date,
        amount: editing.amount.toString(),
        category: editing.category,
        description: editing.description,
      });
    }
  }, [editing]);

  function validate(): boolean {
    const errs: Partial<Record<keyof ExpenseFormData, string>> = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      errs.amount = 'Enter a valid amount greater than 0';
    if (!form.description.trim()) errs.description = 'Description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    onClose();
  }

  function set(field: keyof ExpenseFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow ${
                errors.date ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
                className={`w-full rounded-lg border pl-7 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow ${
                  errors.amount ? 'border-red-400' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What did you spend on?"
              maxLength={100}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow ${
                errors.description ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 active:bg-violet-800 transition-colors shadow-sm"
            >
              {editing ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
