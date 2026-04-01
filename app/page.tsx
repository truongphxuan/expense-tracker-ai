'use client';

import { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import SummaryCards from './components/SummaryCards';
import Charts from './components/Charts';
import ExpenseFilters from './components/ExpenseFilters';
import ExpenseList from './components/ExpenseList';
import ExpenseForm from './components/ExpenseForm';
import { useExpenses } from './hooks/useExpenses';
import { Expense, Filters, ExpenseFormData } from './types/expense';
import { filterExpenses, exportToCSV } from './lib/utils';
import { Plus, Download, BarChart2, List } from 'lucide-react';

const DEFAULT_FILTERS: Filters = {
  search: '',
  category: 'All',
  dateFrom: '',
  dateTo: '',
};

export default function Home() {
  const { expenses, isLoaded, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<'list' | 'charts'>('list');

  const filtered = useMemo(() => filterExpenses(expenses, filters), [expenses, filters]);

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingExpense(null);
  }

  function handleFormSubmit(data: ExpenseFormData) {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
    } else {
      addExpense(data);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page Title + Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track and manage your expenses</p>
          </div>
          <div className="flex items-center gap-2">
            {expenses.length > 0 && (
              <button
                onClick={() => exportToCSV(expenses)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download size={14} />
                Export Data
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards expenses={expenses} />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'list'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={14} />
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'charts'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart2 size={14} />
            Charts
          </button>
        </div>

        {activeTab === 'list' ? (
          <>
            <ExpenseFilters filters={filters} onChange={setFilters} />
            <ExpenseList expenses={filtered} onEdit={handleEdit} onDelete={deleteExpense} />
          </>
        ) : (
          <Charts expenses={expenses} />
        )}
      </main>

      {showForm && (
        <ExpenseForm
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          editing={editingExpense}
        />
      )}
    </div>
  );
}
