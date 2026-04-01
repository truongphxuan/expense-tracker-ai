import { Expense, Category } from '../types/expense';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface MonthlyTrend {
  month: string;       // 'Jan 2026'
  amount: number;
  count: number;
}

export interface CategoryInsight {
  category: Category;
  amount: number;
  count: number;
  pct: number;         // percentage of total spend
  avgTransaction: number;
}

export interface SpendingInsight {
  type: 'high' | 'low' | 'trend-up' | 'trend-down' | 'top-category';
  title: string;
  detail: string;
  value?: string;
}

export function monthlyTrends(expenses: Expense[], months = 6): MonthlyTrend[] {
  const map: Record<string, { amount: number; count: number }> = {};
  const cutoff = format(subMonths(new Date(), months - 1), 'yyyy-MM');

  expenses.forEach((e) => {
    const key = e.date.slice(0, 7); // 'yyyy-MM'
    if (key < cutoff) return;
    if (!map[key]) map[key] = { amount: 0, count: 0 };
    map[key].amount += e.amount;
    map[key].count += 1;
  });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      month: format(parseISO(`${key}-01`), 'MMM yyyy'),
      amount: v.amount,
      count: v.count,
    }));
}

export function categoryInsights(expenses: Expense[]): CategoryInsight[] {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const map: Record<string, { amount: number; count: number }> = {};

  expenses.forEach((e) => {
    if (!map[e.category]) map[e.category] = { amount: 0, count: 0 };
    map[e.category].amount += e.amount;
    map[e.category].count += 1;
  });

  return Object.entries(map)
    .map(([category, v]) => ({
      category: category as Category,
      amount: v.amount,
      count: v.count,
      pct: total > 0 ? (v.amount / total) * 100 : 0,
      avgTransaction: v.count > 0 ? v.amount / v.count : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function generateInsights(expenses: Expense[]): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  if (expenses.length === 0) return insights;

  const trends = monthlyTrends(expenses, 3);
  const cats = categoryInsights(expenses);

  // Top category
  if (cats[0]) {
    insights.push({
      type: 'top-category',
      title: `${cats[0].category} is your biggest spend`,
      detail: `${cats[0].pct.toFixed(0)}% of total spending`,
      value: `$${cats[0].amount.toFixed(2)}`,
    });
  }

  // Month-over-month trend
  if (trends.length >= 2) {
    const last = trends[trends.length - 1];
    const prev = trends[trends.length - 2];
    const delta = last.amount - prev.amount;
    const pct = prev.amount > 0 ? Math.abs(delta / prev.amount) * 100 : 0;
    if (delta > 0) {
      insights.push({
        type: 'trend-up',
        title: 'Spending increased this month',
        detail: `Up ${pct.toFixed(0)}% vs last month`,
        value: `+$${delta.toFixed(2)}`,
      });
    } else if (delta < 0) {
      insights.push({
        type: 'trend-down',
        title: 'Spending decreased this month',
        detail: `Down ${pct.toFixed(0)}% vs last month`,
        value: `-$${Math.abs(delta).toFixed(2)}`,
      });
    }
  }

  // High single transaction
  const max = expenses.reduce((best, e) => (e.amount > best.amount ? e : best), expenses[0]);
  insights.push({
    type: 'high',
    title: 'Largest single transaction',
    detail: `${max.description} · ${max.date}`,
    value: `$${max.amount.toFixed(2)}`,
  });

  return insights;
}
