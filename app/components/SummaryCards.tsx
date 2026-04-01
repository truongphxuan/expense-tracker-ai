'use client';

import { Expense } from '../types/expense';
import {
  formatCurrency,
  totalAmount,
  currentMonthExpenses,
  expensesByCategory,
  CATEGORY_COLORS,
} from '../lib/utils';
import { TrendingUp, Calendar, Tag, Receipt } from 'lucide-react';

interface Props {
  expenses: Expense[];
}

export default function SummaryCards({ expenses }: Props) {
  const total = totalAmount(expenses);
  const monthly = currentMonthExpenses(expenses);
  const monthlyTotal = totalAmount(monthly);
  const byCategory = expensesByCategory(expenses);
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const cards = [
    {
      label: 'Total Expenses',
      value: formatCurrency(total),
      sub: `${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}`,
      icon: Receipt,
      color: 'bg-violet-50 text-violet-600',
      border: 'border-violet-100',
    },
    {
      label: 'This Month',
      value: formatCurrency(monthlyTotal),
      sub: `${monthly.length} transaction${monthly.length !== 1 ? 's' : ''}`,
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'Top Category',
      value: topCategory ? topCategory[0] : '—',
      sub: topCategory ? formatCurrency(topCategory[1]) : 'No expenses yet',
      icon: Tag,
      color: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    {
      label: 'Avg per Transaction',
      value: expenses.length ? formatCurrency(total / expenses.length) : '—',
      sub: 'all time average',
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-white rounded-xl border ${card.border} p-4 shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="mt-1.5 text-xl font-bold text-gray-900 leading-tight">
                  {card.value}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{card.sub}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
