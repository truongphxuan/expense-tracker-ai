import { Expense, Category } from '../types/expense';
import { format, subMonths, startOfYear } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'sheets';
export type CloudProvider = 'google-drive' | 'google-sheets' | 'dropbox' | 'onedrive' | 'notion' | 'email';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';
export type ExportStatus = 'success' | 'running' | 'failed' | 'scheduled';

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  format: ExportFormat;
  accentColor: string;
  bgColor: string;
  tag: string;
  filterFn: (expenses: Expense[]) => Expense[];
}

export interface CloudService {
  id: CloudProvider;
  name: string;
  description: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  comingSoon?: boolean;
}

export interface CloudConnection {
  provider: CloudProvider;
  connected: boolean;
  accountEmail?: string;
  connectedAt?: string;
}

export interface ScheduleConfig {
  enabled: boolean;
  frequency: ScheduleFrequency;
  hour: number; // 0-23
  templateId: string;
  destination: CloudProvider | 'download';
  createdAt: string;
}

export interface ExportHistoryEntry {
  id: string;
  timestamp: string;
  templateName: string;
  format: ExportFormat;
  recordCount: number;
  totalAmount: number;
  destination: string;
  status: ExportStatus;
  fileSize: string;
  duration: number; // ms
}

// ── Templates ──────────────────────────────────────────────────────────────

export const TEMPLATES: ExportTemplate[] = [
  {
    id: 'full-backup',
    name: 'Full Backup',
    description: 'All expenses, all time. Perfect for migration or archival.',
    emoji: '🗄️',
    format: 'json',
    accentColor: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
    tag: 'Backup',
    filterFn: (e) => e,
  },
  {
    id: 'tax-report',
    name: 'Tax Report',
    description: 'Current year expenses formatted for tax filing. Includes category totals.',
    emoji: '🧾',
    format: 'pdf',
    accentColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    tag: 'Tax',
    filterFn: (expenses) => {
      const start = format(startOfYear(new Date()), 'yyyy-MM-dd');
      return expenses.filter((e) => e.date >= start);
    },
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: 'Last 30 days of spending. Great for monthly budget reviews.',
    emoji: '📅',
    format: 'pdf',
    accentColor: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    tag: 'Monthly',
    filterFn: (expenses) => {
      const cutoff = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
      return expenses.filter((e) => e.date >= cutoff);
    },
  },
  {
    id: 'category-analysis',
    name: 'Category Analysis',
    description: 'Breakdown by category for all time. Ideal for budget planning.',
    emoji: '📊',
    format: 'csv',
    accentColor: 'text-violet-700',
    bgColor: 'bg-violet-50 border-violet-200',
    tag: 'Analytics',
    filterFn: (e) => [...e].sort((a, b) => a.category.localeCompare(b.category)),
  },
  {
    id: 'business-expenses',
    name: 'Business Expenses',
    description: 'Bills and Transportation only — ready for expense reimbursement.',
    emoji: '💼',
    format: 'csv',
    accentColor: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    tag: 'Business',
    filterFn: (expenses) =>
      expenses.filter((e) => e.category === 'Bills' || e.category === 'Transportation'),
  },
  {
    id: 'dining-entertainment',
    name: 'Dining & Entertainment',
    description: 'Food and Entertainment spending. Track your lifestyle costs.',
    emoji: '🍽️',
    format: 'csv',
    accentColor: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
    tag: 'Lifestyle',
    filterFn: (expenses) =>
      expenses.filter((e) => e.category === 'Food' || e.category === 'Entertainment'),
  },
];

// ── Cloud Services ─────────────────────────────────────────────────────────

export const CLOUD_SERVICES: CloudService[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Save reports directly to your Drive folder',
    emoji: '📁',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Sync expenses to a live spreadsheet, auto-updated',
    emoji: '📗',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Automatically upload to your Dropbox/Apps folder',
    emoji: '📦',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Sync with Microsoft OneDrive & Excel Online',
    emoji: '☁️',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Push expenses to a Notion database page',
    emoji: '📝',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    comingSoon: true,
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Send reports to your inbox on a schedule',
    emoji: '📧',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
];

// ── localStorage helpers ───────────────────────────────────────────────────

const HISTORY_KEY = 'export_history_v3';
const SCHEDULE_KEY = 'export_schedule_v3';
const CONNECTIONS_KEY = 'export_connections_v3';

export function loadHistory(): ExportHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function addHistoryEntry(entry: Omit<ExportHistoryEntry, 'id'>): ExportHistoryEntry {
  const full: ExportHistoryEntry = { id: `${Date.now()}`, ...entry };
  const history = [full, ...loadHistory()].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return full;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function loadSchedule(): ScheduleConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSchedule(config: ScheduleConfig): void {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(config));
}

export function loadConnections(): CloudConnection[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CONNECTIONS_KEY) || '[]');
  } catch { return []; }
}

export function saveConnections(connections: CloudConnection[]): void {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}

// ── Export runners ─────────────────────────────────────────────────────────

export function buildCSV(expenses: Expense[]): string {
  const rows = [
    ['Date', 'Category', 'Amount', 'Description'],
    ...expenses.map((e) => [e.date, e.category, e.amount.toFixed(2), `"${e.description.replace(/"/g, '""')}"`]),
  ];
  return rows.map((r) => r.join(',')).join('\n');
}

export function buildJSON(expenses: Expense[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      totalRecords: expenses.length,
      totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
      expenses: expenses.map(({ id, createdAt, ...rest }) => rest),
    },
    null,
    2
  );
}

export function triggerDownload(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function estimateFileSize(content: string): string {
  const bytes = new TextEncoder().encode(content).length;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
