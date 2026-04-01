'use client';

import { useState, useMemo, useCallback } from 'react';
import { Expense, Category } from '../types/expense';
import {
  ExportFormat,
  ExportOptions,
  applyExportFilters,
  exportCSV,
  exportJSON,
  exportPDF,
} from '../lib/exporters';
import { CATEGORIES, formatCurrency, formatDate, CATEGORY_BG } from '../lib/utils';
import { format } from 'date-fns';
import {
  X,
  FileText,
  FileJson,
  FileDown,
  Calendar,
  Tag,
  Eye,
  Download,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Props {
  expenses: Expense[];
  onClose: () => void;
}

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  {
    id: 'csv',
    label: 'CSV',
    description: 'Spreadsheet-compatible',
    icon: FileText,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  {
    id: 'json',
    label: 'JSON',
    description: 'For developers & APIs',
    icon: FileJson,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'Print-ready report',
    icon: FileDown,
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-200',
  },
];

const PREVIEW_PAGE_SIZE = 5;

type ExportState = 'idle' | 'loading' | 'done';

export default function ExportModal({ expenses, onClose }: Props) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [filename, setFilename] = useState(
    `expenses-${new Date().toISOString().slice(0, 10)}`
  );
  const [previewPage, setPreviewPage] = useState(0);
  const [exportState, setExportState] = useState<ExportState>('idle');

  // Filtered preview data
  const filtered = useMemo(
    () =>
      applyExportFilters(expenses, {
        dateFrom,
        dateTo,
        categories: selectedCategories,
      }),
    [expenses, dateFrom, dateTo, selectedCategories]
  );

  const totalAmount = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered]
  );

  const pageCount = Math.ceil(filtered.length / PREVIEW_PAGE_SIZE);
  const previewRows = filtered.slice(
    previewPage * PREVIEW_PAGE_SIZE,
    (previewPage + 1) * PREVIEW_PAGE_SIZE
  );

  function toggleCategory(cat: Category) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setPreviewPage(0);
  }

  function toggleAllCategories() {
    setSelectedCategories((prev) =>
      prev.length === CATEGORIES.length ? [] : [...CATEGORIES]
    );
    setPreviewPage(0);
  }

  const handleExport = useCallback(async () => {
    if (filtered.length === 0) return;
    setExportState('loading');
    try {
      await new Promise((r) => setTimeout(r, 400)); // brief loading feel
      if (format === 'csv') exportCSV(filtered, filename);
      else if (format === 'json') exportJSON(filtered, filename);
      else await exportPDF(filtered, filename);
      setExportState('done');
      setTimeout(() => setExportState('idle'), 2000);
    } catch (err) {
      console.error(err);
      setExportState('idle');
    }
  }, [filtered, format, filename]);

  const allCatsSelected = selectedCategories.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Export Data</h2>
            <p className="text-xs text-gray-400 mt-0.5">Choose format, filters, and preview before downloading</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── Format Selector ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Export Format
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {FORMAT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFormat(opt.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      active
                        ? `${opt.bg} border-current ${opt.color} shadow-sm`
                        : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    <Icon size={22} />
                    <div className="text-center">
                      <p className="text-sm font-semibold leading-none">{opt.label}</p>
                      <p className="text-[10px] mt-1 opacity-70">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Filters ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Calendar size={12} /> Date Range
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPreviewPage(0); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPreviewPage(0); }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Tag size={12} /> Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleAllCategories}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  allCatsSelected
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? CATEGORY_BG[cat] + ' border-transparent'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Summary ── */}
          <section className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400">Records</p>
                <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div>
                <p className="text-xs text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              {filtered.length !== expenses.length && (
                <>
                  <div className="h-10 w-px bg-gray-200" />
                  <div>
                    <p className="text-xs text-gray-400">Filtered from</p>
                    <p className="text-sm font-medium text-gray-500">{expenses.length} total</p>
                  </div>
                </>
              )}
            </div>
            {filtered.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                No records match your filters
              </p>
            )}
          </section>

          {/* ── Preview ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Eye size={12} /> Preview
            </h3>

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 h-32 flex items-center justify-center">
                <p className="text-sm text-gray-300">No data to preview</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Date</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Category</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 text-right">Amount</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {previewRows.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BG[e.category]}`}>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 font-semibold text-right whitespace-nowrap">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 truncate max-w-[200px]">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {pageCount > 1 && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                    <span className="text-xs text-gray-400">
                      Showing {previewPage * PREVIEW_PAGE_SIZE + 1}–
                      {Math.min((previewPage + 1) * PREVIEW_PAGE_SIZE, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                        disabled={previewPage === 0}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs text-gray-500 px-1">
                        {previewPage + 1} / {pageCount}
                      </span>
                      <button
                        onClick={() => setPreviewPage((p) => Math.min(pageCount - 1, p + 1))}
                        disabled={previewPage === pageCount - 1}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Filename ── */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Filename
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value || 'expenses')}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-gray-50"
                placeholder="expenses"
              />
              <span className="text-sm text-gray-400 font-medium shrink-0">
                .{format}
              </span>
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={filtered.length === 0 || exportState !== 'idle'}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              exportState === 'done'
                ? 'bg-emerald-500 text-white'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {exportState === 'loading' && <Loader2 size={15} className="animate-spin" />}
            {exportState === 'done' && <CheckCircle2 size={15} />}
            {exportState === 'idle' && <Download size={15} />}

            {exportState === 'loading' && 'Exporting…'}
            {exportState === 'done' && 'Exported!'}
            {exportState === 'idle' &&
              `Export ${filtered.length} record${filtered.length !== 1 ? 's' : ''} as ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
