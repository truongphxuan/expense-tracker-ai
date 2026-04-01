'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts';
import { Expense } from '../types/expense';
import { monthlyTrends, categoryInsights, generateInsights } from '../lib/analytics';
import { formatCurrency, CATEGORY_COLORS } from '../lib/utils';
import { TrendingUp, TrendingDown, AlertCircle, Tag } from 'lucide-react';

interface Props {
  expenses: Expense[];
}

const INSIGHT_ICONS = {
  'high': AlertCircle,
  'low': AlertCircle,
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
  'top-category': Tag,
};

const INSIGHT_COLORS = {
  'high': 'text-amber-600 bg-amber-50 border-amber-100',
  'low': 'text-blue-600 bg-blue-50 border-blue-100',
  'trend-up': 'text-red-600 bg-red-50 border-red-100',
  'trend-down': 'text-emerald-600 bg-emerald-50 border-emerald-100',
  'top-category': 'text-violet-600 bg-violet-50 border-violet-100',
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-gray-700">{label}</p>
        <p className="text-violet-600 font-semibold">{formatCurrency(payload[0].value)}</p>
        {payload[0].payload.count !== undefined && (
          <p className="text-gray-400 text-xs">{payload[0].payload.count} transactions</p>
        )}
      </div>
    );
  }
  return null;
};

export default function AnalyticsDashboard({ expenses }: Props) {
  const trends = monthlyTrends(expenses, 6);
  const cats = categoryInsights(expenses);
  const insights = generateInsights(expenses);

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
        <TrendingUp size={32} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Add expenses to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI-style Insights strip */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insights.map((ins, i) => {
            const Icon = INSIGHT_ICONS[ins.type];
            const colors = INSIGHT_COLORS[ins.type];
            return (
              <div key={i} className={`rounded-xl border p-4 ${colors}`}>
                <div className="flex items-start gap-3">
                  <Icon size={16} className="mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{ins.title}</p>
                    <p className="text-xs opacity-70 mt-0.5 truncate">{ins.detail}</p>
                  </div>
                  {ins.value && (
                    <span className="text-sm font-bold shrink-0 ml-auto">{ins.value}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly spending trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Spending Trend</h3>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trends} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<BarTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-300 text-center py-12">Not enough data yet</p>
        )}
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {cats.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}
                  />
                  <span className="text-sm text-gray-700">{cat.category}</span>
                  <span className="text-xs text-gray-400">{cat.count} txn{cat.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{cat.pct.toFixed(0)}%</span>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${cat.pct}%`,
                    backgroundColor: CATEGORY_COLORS[cat.category],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Avg transaction per category */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Average Transaction by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cats} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v: number) => formatCurrency(Number(v))} />
            <Bar dataKey="avgTransaction" radius={[4, 4, 0, 0]}>
              {cats.map((cat) => (
                <Cell key={cat.category} fill={CATEGORY_COLORS[cat.category]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
