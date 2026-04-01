import { Expense, Category, Filters } from '../types/expense';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const CATEGORIES: Category[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#f97316',
  Transportation: '#3b82f6',
  Entertainment: '#a855f7',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Other: '#6b7280',
};

export const CATEGORY_BG: Record<Category, string> = {
  Food: 'bg-orange-100 text-orange-700',
  Transportation: 'bg-blue-100 text-blue-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Shopping: 'bg-pink-100 text-pink-700',
  Bills: 'bg-red-100 text-red-700',
  Other: 'bg-gray-100 text-gray-700',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function filterExpenses(expenses: Expense[], filters: Filters): Expense[] {
  return expenses.filter((e) => {
    const matchesSearch =
      !filters.search ||
      e.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      e.category.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory =
      filters.category === 'All' || e.category === filters.category;

    const matchesFrom =
      !filters.dateFrom || e.date >= filters.dateFrom;

    const matchesTo =
      !filters.dateTo || e.date <= filters.dateTo;

    return matchesSearch && matchesCategory && matchesFrom && matchesTo;
  });
}

export function totalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function currentMonthExpenses(expenses: Expense[]): Expense[] {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return expenses.filter((e) => {
    try {
      return isWithinInterval(parseISO(e.date), { start, end });
    } catch {
      return false;
    }
  });
}

export function expensesByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
}

export function expensesByMonth(expenses: Expense[]): { month: string; amount: number }[] {
  const map: Record<string, number> = {};
  expenses.forEach((e) => {
    try {
      const key = format(parseISO(e.date), 'MMM yyyy');
      map[key] = (map[key] || 0) + e.amount;
    } catch {
      // skip
    }
  });
  return Object.entries(map)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => {
      // sort chronologically
      const da = new Date(a.month);
      const db = new Date(b.month);
      return da.getTime() - db.getTime();
    })
    .slice(-6); // last 6 months
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Date', 'Amount', 'Category', 'Description'];
  const rows = expenses.map((e) => [
    e.date,
    e.amount.toFixed(2),
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
