# Advanced Export Modal — Developer Documentation

> **Type:** frontend
> **Status:** implemented
> **Branch:** feature-data-export-v2
> **Last updated:** 2026-04-01

## Overview

The Advanced Export Modal is a self-contained modal component that lets users export expenses in CSV, JSON, or styled PDF format. It provides date-range and category filtering, a live paginated preview table, a customizable filename input, and animated state transitions (idle → loading → done). It supersedes the v1 single-button CSV export.

## Architecture

### Files & Responsibilities

| File | Role | Key exports |
|------|------|-------------|
| `app/components/ExportModal.tsx` | Modal UI — format selection, filters, preview, export trigger | `default ExportModal` |
| `app/lib/exporters.ts` | Format-specific generation + shared download helper | `exportCSV`, `exportJSON`, `exportPDF`, `applyExportFilters`, `triggerDownload`, `estimateFileSize` |
| `app/page.tsx` | Mounts modal, controls `showExport` boolean state | — |
| `app/types/expense.ts` | `Expense`, `Category` types consumed by exporters | `Expense`, `Category` |

### Data Flow

```
page.tsx
  └─ showExport state ──► <ExportModal expenses={expenses} onClose={...} />
                                │
                    ┌───────────┴────────────┐
                    │   User configures:     │
                    │   format / dates /     │
                    │   categories / name    │
                    └───────────┬────────────┘
                                │
                    useMemo: applyExportFilters(expenses, opts)
                                │
                    Filtered expense list ──► Preview table (5 rows, paginated)
                                │
                    User clicks "Export"
                                │
                    handleExport() ──► exportState: 'loading'
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                  CSV          JSON        PDF
                    │           │           │
               exportCSV()  exportJSON()  exportPDF()  ← async (dynamic import jspdf)
                    │           │           │
                    └───────────┴───────────┘
                                │
                    triggerDownload(blob, filename)
                                │
                    exportState: 'done' → 'idle'
```

### Type Definitions

```typescript
// app/lib/exporters.ts
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;     // without extension
  dateFrom: string;     // ISO date 'YYYY-MM-DD', empty string = no lower bound
  dateTo: string;       // ISO date 'YYYY-MM-DD', empty string = no upper bound
  categories: Category[]; // empty array = all categories (no filter applied)
}

// app/types/expense.ts (consumed, not owned)
export type Category =
  | 'Food' | 'Transportation' | 'Entertainment'
  | 'Shopping' | 'Bills' | 'Other';

export interface Expense {
  id: string;
  date: string;         // 'YYYY-MM-DD'
  amount: number;       // USD, always positive
  category: Category;
  description: string;
  createdAt: string;    // ISO datetime
}
```

### State Management

All state is local to `ExportModal`. Nothing is persisted. State is lost when the modal closes.

```
ExportModal internal state machine:

  format:            'csv' | 'json' | 'pdf'          (default: 'csv')
  dateFrom:          string                            (default: '')
  dateTo:            string                            (default: '')
  selectedCategories: Category[]                       (default: [])
  filename:          string                            (default: 'expenses-YYYY-MM-DD')
  previewPage:       number                            (default: 0)
  exportState:       'idle' → 'loading' → 'done' → 'idle'

Export state transitions:
  idle ──[click export]──► loading
  loading ──[400ms + async]──► done
  done ──[2000ms timeout]──► idle
  loading ──[error]──► idle
```

**Derived values (useMemo):**
- `filtered` — result of `applyExportFilters(expenses, {dateFrom, dateTo, categories})`
- `totalAmount` — sum of `filtered[].amount`
- `pageCount` — `Math.ceil(filtered.length / 5)`
- `previewRows` — 5-item slice of `filtered` at current page

### Key Functions / Components

#### `ExportModal` (component)

```typescript
export default function ExportModal({
  expenses: Expense[],  // full unfiltered expense list
  onClose: () => void,  // called on Cancel or after export
}: Props): JSX.Element
```

Renders the full modal. Calls format-specific exporters from `exporters.ts` on submit. Stays open after export — user must close manually.

---

#### `applyExportFilters(expenses, opts)`

```typescript
export function applyExportFilters(
  expenses: Expense[],
  opts: Pick<ExportOptions, 'dateFrom' | 'dateTo' | 'categories'>
): Expense[]
```

**Purpose:** Returns a filtered subset of expenses matching all supplied criteria.

**Logic:**
- `dateFrom`: `e.date >= opts.dateFrom` (lexicographic ISO comparison — correct because dates are YYYY-MM-DD)
- `dateTo`: `e.date <= opts.dateTo`
- `categories`: `opts.categories.includes(e.category)` — **empty array skips this check** (means "all")
- All predicates are ANDed

**Edge cases:**
- Empty `dateFrom` or `dateTo` → that bound is skipped (open-ended range)
- Empty `categories` array → no category filtering applied
- Returns original array order (no sorting)

---

#### `exportCSV(expenses, filename)`

```typescript
export function exportCSV(expenses: Expense[], filename: string): void
```

**Purpose:** Generates a UTF-8 CSV file and triggers browser download.

**Column order:** Date, Category, Amount, Description

**Escaping:** Description values are wrapped in double-quotes; internal `"` → `""`

**Side effects:** Creates and revokes a Blob object URL, triggers browser download.

---

#### `exportJSON(expenses, filename)`

```typescript
export function exportJSON(expenses: Expense[], filename: string): void
```

**Purpose:** Generates a structured JSON file. Strips internal fields before export.

**Output shape:**
```json
{
  "exportedAt": "2026-04-01T09:00:00.000Z",
  "totalRecords": 47,
  "totalAmount": 1234.56,
  "expenses": [
    { "date": "2026-03-15", "amount": 42.50, "category": "Food", "description": "Lunch" }
  ]
}
```

Strips `id` and `createdAt` — internal fields not meaningful to users.

---

#### `exportPDF(expenses, filename)` ⚠️ async

```typescript
export async function exportPDF(expenses: Expense[], filename: string): Promise<void>
```

**Purpose:** Generates a styled landscape PDF report using jsPDF.

**Why async:** `jsPDF` is dynamically imported to avoid adding it to the initial bundle.

**Layout (A4 landscape, points):**

| Section | Y offset | Height | Style |
|---------|----------|--------|-------|
| Header bar | 0 | 56pt | Violet-700 fill |
| Summary bar | 56 | 36pt | Violet-50 fill |
| Table headers | 92 | 28pt | Gray-100 fill |
| Data rows | 120+ | 20pt each | Alternating gray-50 / white |
| Footer | pageH - 20 | — | Gray text, centered |

**Column widths (landscape A4, 841pt wide, 80pt margins):**
- Date: 90pt
- Category: 110pt
- Amount: 80pt
- Description: 260pt

**Page breaks:** Triggered when `y + rowH > pageH - 40`. Redraws table header on new page.

---

#### `triggerDownload(blob, filename, mime)`

```typescript
export function triggerDownload(blob: Blob, filename: string): void
```

Shared utility. Creates an invisible `<a>` element, sets `href` to an object URL, triggers `.click()`, then revokes the URL.

### External Dependencies

| Library | Version | Why used | Bundle impact |
|---------|---------|----------|---------------|
| `jspdf` | ^4.2.1 | PDF layout and generation | ~180KB minified (dynamically imported) |
| `date-fns` | (existing) | `format()` for dated filenames | Already in bundle |
| `lucide-react` | (existing) | Icons in modal UI | Existing |

### Error Handling

| Scenario | How handled |
|----------|-------------|
| PDF generation throws | `try/catch` in `handleExport` — logs to console, resets `exportState` to `'idle'` |
| Export with 0 records | Export button disabled (`filtered.length === 0`) |
| JSON.stringify fails | Not caught (would surface as an uncaught promise rejection) |
| Object URL creation fails | Not caught (relies on browser API availability) |
| User closes modal mid-export | Export continues; `onClose` is not called automatically |

### Performance Considerations

- **Filtering** is memoized via `useMemo` — only recomputes when `expenses`, `dateFrom`, `dateTo`, or `selectedCategories` change
- **jsPDF** is code-split via dynamic import — not included in the initial bundle
- **PDF generation** is O(n) in rows but involves significant DOM manipulation per row; can be slow for >1000 records (estimated >3s)
- **CSV/JSON** are O(n) string operations — negligible for typical personal finance datasets
- **Preview table** renders only 5 rows at a time — no virtualization needed

### Security Considerations

- No server calls — all generation is client-side
- User-supplied `filename` is not sanitized — browsers generally handle path separators safely in download attributes
- Description content is CSV-escaped but not HTML-escaped (safe because it's never rendered as HTML)
- jsPDF processes data from localStorage, not from user input at export time

### Extension Points

**Adding a new export format (e.g. XLSX):**
1. Add `'xlsx'` to `ExportFormat` type in `exporters.ts`
2. Add an `exportXLSX(expenses, filename)` function in `exporters.ts`
3. Add a card to `FORMAT_OPTIONS` array in `ExportModal.tsx`
4. Add a case to the `if/else` in `handleExport` in `ExportModal.tsx`

**Adding a new filter type (e.g. amount range):**
1. Add `amountMin`/`amountMax` fields to `ExportOptions`
2. Add predicate in `applyExportFilters()`
3. Add UI inputs in the filter section of `ExportModal.tsx`
4. Add to `ExportModal` state

**Changing column order in CSV:**
Edit the `headers` array and corresponding `rows` mapping in `exportCSV()` in `exporters.ts`.

### Known Limitations

- No export history — each session starts fresh
- No cloud destination support — download only
- PDF can be slow or freeze the browser for large datasets (>1000 records)
- `filename` input has no sanitization or length limit
- No progress indicator for long PDF exports
- Modal does not close automatically after export

### Related Documentation

- **User guide:** [`docs/user/advanced-export-modal.md`](../user/advanced-export-modal.md)
- **Code analysis (all versions):** [`code-analysis.md`](../../code-analysis.md)
- **V1 export (simpler baseline):** `app/lib/utils.ts` — `exportToCSV()`
- **V3 export (successor):** [`docs/dev/cloud-export-hub.md`](cloud-export-hub.md) *(if generated)*
