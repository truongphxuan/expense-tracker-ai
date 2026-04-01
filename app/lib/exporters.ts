import { Expense, Category } from '../types/expense';
import { format, parseISO } from 'date-fns';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  dateFrom: string;
  dateTo: string;
  categories: Category[];
}

// ── Filtering ──────────────────────────────────────────────────────────────

export function applyExportFilters(
  expenses: Expense[],
  opts: Pick<ExportOptions, 'dateFrom' | 'dateTo' | 'categories'>
): Expense[] {
  return expenses.filter((e) => {
    const afterFrom = !opts.dateFrom || e.date >= opts.dateFrom;
    const beforeTo = !opts.dateTo || e.date <= opts.dateTo;
    const inCategory = opts.categories.length === 0 || opts.categories.includes(e.category);
    return afterFrom && beforeTo && inCategory;
  });
}

// ── CSV ────────────────────────────────────────────────────────────────────

export function exportCSV(expenses: Expense[], filename: string): void {
  const headers = ['Date', 'Category', 'Amount', 'Description'];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    e.amount.toFixed(2),
    `"${e.description.replace(/"/g, '""')}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  triggerDownload(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `${filename}.csv`
  );
}

// ── JSON ───────────────────────────────────────────────────────────────────

export function exportJSON(expenses: Expense[], filename: string): void {
  const data = {
    exportedAt: new Date().toISOString(),
    totalRecords: expenses.length,
    totalAmount: expenses.reduce((s, e) => s + e.amount, 0),
    expenses: expenses.map(({ id, createdAt, ...rest }) => rest),
  };
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    `${filename}.json`
  );
}

// ── PDF ────────────────────────────────────────────────────────────────────

export async function exportPDF(expenses: Expense[], filename: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const colWidths = [90, 110, 80, 260]; // Date, Category, Amount, Description
  const rowH = 20;
  const headerH = 28;

  // ── Header bar ──
  doc.setFillColor(109, 40, 217); // violet-700
  doc.rect(0, 0, pageW, 56, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense Report', margin, 36);

  const exportDate = format(new Date(), 'MMMM d, yyyy');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${exportDate}`, pageW - margin, 36, { align: 'right' });

  // ── Summary bar ──
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  doc.setFillColor(245, 243, 255); // violet-50
  doc.rect(0, 56, pageW, 36, 'F');
  doc.setTextColor(109, 40, 217);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${expenses.length} record${expenses.length !== 1 ? 's' : ''}   ·   Total: $${total.toFixed(2)}`,
    margin,
    79
  );

  // ── Table ──
  let y = 110;

  const drawTableHeader = () => {
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(margin, y, pageW - margin * 2, headerH, 'F');
    doc.setTextColor(75, 85, 99); // gray-600
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const labels = ['Date', 'Category', 'Amount', 'Description'];
    let x = margin + 8;
    labels.forEach((label, i) => {
      doc.text(label, x, y + 18);
      x += colWidths[i];
    });
    y += headerH;
  };

  drawTableHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  expenses.forEach((e, idx) => {
    if (y + rowH > pageH - 40) {
      doc.addPage();
      y = 40;
      drawTableHeader();
    }

    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251); // gray-50
      doc.rect(margin, y, pageW - margin * 2, rowH, 'F');
    }

    doc.setTextColor(31, 41, 55); // gray-800
    let x = margin + 8;

    doc.text(e.date, x, y + 14);
    x += colWidths[0];

    // Category pill color
    const catColors: Record<string, [number, number, number]> = {
      Food: [249, 115, 22],
      Transportation: [59, 130, 246],
      Entertainment: [168, 85, 247],
      Shopping: [236, 72, 153],
      Bills: [239, 68, 68],
      Other: [107, 114, 128],
    };
    const [r, g, b] = catColors[e.category] || [107, 114, 128];
    doc.setTextColor(r, g, b);
    doc.text(e.category, x, y + 14);
    doc.setTextColor(31, 41, 55);
    x += colWidths[1];

    doc.text(`$${e.amount.toFixed(2)}`, x, y + 14);
    x += colWidths[2];

    // Truncate description if too long
    const maxDescW = colWidths[3] - 16;
    const desc = doc.splitTextToSize(e.description, maxDescW)[0];
    doc.text(desc, x, y + 14);

    // Row bottom border
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.line(margin, y + rowH, pageW - margin, y + rowH);

    y += rowH;
  });

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(
      `Page ${i} of ${pageCount}  ·  Expense Tracker`,
      pageW / 2,
      pageH - 20,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
}

// ── Shared ─────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
