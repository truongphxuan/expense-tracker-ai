'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Expense } from '../types/expense';
import {
  expensesByCategory,
  expensesByMonth,
  formatCurrency,
  CATEGORY_COLORS,
} from '../lib/utils';

interface Props {
  expenses: Expense[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-gray-700">{label}</p>
        <p className="text-violet-600 font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function Charts({ expenses }: Props) {
  const byCategory = expensesByCategory(expenses);
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const monthlyData = expensesByMonth(expenses);

  if (expenses.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex items-center justify-center h-64"
          >
            <p className="text-gray-400 text-sm">Add expenses to see charts</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending Over Time</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-gray-400 text-sm">Not enough data yet</p>
          </div>
        )}
      </div>

      {/* Category Pie Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending by Category</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-gray-400 text-sm">Not enough data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
