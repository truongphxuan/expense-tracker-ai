import { Expense } from '../types/expense';
import { format } from 'date-fns';

export function exportCSV(expenses: Expense[]): void {
  const headers = ['Date', 'Category', 'Amount', 'Description'];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    e.amount.toFixed(2),
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  download(new Blob([csv], { type: 'text/csv' }), `expenses-${today()}.csv`);
}

export function exportJSON(expenses: Expense[]): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map(({ id, createdAt, ...rest }) => rest),
  };
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `expenses-${today()}.json`
  );
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
