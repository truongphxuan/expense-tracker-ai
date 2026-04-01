# How to Export Your Expenses — User Guide

> **Difficulty:** Easy
> **Time required:** 2 minutes

## What is the Export feature?

The Export feature lets you download your expense data as a file you can open in other apps — like Excel, Google Sheets, or your accountant's software. You can choose the file format, filter by date or category, preview exactly what will be exported, and give the file a custom name before downloading.

## Before You Start

- [ ] You need at least one expense added to your tracker
- [ ] The "Export Data" button only appears when you have expenses

---

## Step-by-Step Instructions

### Step 1 — Open the Export dialog

Click the **Export Data** button in the top-right corner of the dashboard.

![Screenshot: Dashboard header showing the Export Data button next to Add Expense](screenshots/advanced-export-step-1-open-button.png)
*The Export Data button appears to the left of the Add Expense button*

> 💡 **Tip:** The Export Data button only shows up when you have at least one expense recorded.

---

### Step 2 — Choose a file format

At the top of the dialog, select the format that suits your needs:

![Screenshot: Format selector showing three cards — CSV, JSON, PDF — with CSV selected](screenshots/advanced-export-step-2-format-selector.png)

| Format | Best for | Opens in |
|--------|----------|----------|
| **CSV** | Spreadsheets, Excel, Google Sheets | Excel, Numbers, Google Sheets |
| **JSON** | Developers, data analysis, importing to other apps | Any text editor, code tools |
| **PDF** | Printing, sharing with your accountant, archiving | Preview, Adobe Reader, any browser |

Click the card for the format you want. It will highlight in the matching colour.

---

### Step 3 — Filter what gets exported (optional)

By default, all your expenses are included. You can narrow it down:

![Screenshot: Filter section with date range inputs and category chip buttons](screenshots/advanced-export-step-3-filters.png)

**By date range:**
- Click the **From** date field and pick a start date
- Click the **To** date field and pick an end date
- Leave either field empty to export from the beginning or up to today

**By category:**
- Click any category pill (Food, Transportation, Entertainment, etc.) to include only that category
- Click multiple pills to include several categories
- Click **All** to go back to including everything

The summary bar updates instantly as you change filters — watch the record count and total amount change.

---

### Step 4 — Preview your data

Below the filters, a preview table shows the first few rows of what will be exported.

![Screenshot: Preview table showing 5 expense rows with date, category, amount, description columns and pagination](screenshots/advanced-export-step-4-preview.png)

Use the **‹ ›** arrows to page through the preview if you have many expenses.

> 💡 **Tip:** If the record count in the summary shows 0, your filters are too narrow — try widening the date range or selecting more categories.

---

### Step 5 — Name your file (optional)

The filename is pre-filled with today's date. You can change it to anything you like.

![Screenshot: Filename input showing "expenses-2026-04-01" with ".csv" extension shown to the right](screenshots/advanced-export-step-5-filename.png)

The file extension (`.csv`, `.json`, or `.pdf`) is added automatically — you don't need to type it.

---

### Step 6 — Download the file

Click the blue **Export X records as [FORMAT]** button at the bottom of the dialog.

![Screenshot: Export button showing "Export 47 records as CSV" in violet, with a loading spinner state and a success checkmark state below](screenshots/advanced-export-step-6-export-button.png)

The button shows:
- **"Export X records as CSV"** — ready to download
- **Spinning icon + "Exporting…"** — generating the file (usually instant, a few seconds for large PDFs)
- **Green checkmark + "Exported!"** — your file has been downloaded

Your browser will save the file to your Downloads folder automatically.

---

## Understanding Each Format

### CSV Files

CSV files open directly in Excel, Google Sheets, and Numbers. Each row is one expense. The columns are:

| Column | Example |
|--------|---------|
| Date | 2026-03-15 |
| Category | Food |
| Amount | 42.50 |
| Description | Lunch with team |

### JSON Files

JSON files contain the same data in a structured format, plus a summary at the top:

```
exportedAt: when you exported
totalRecords: how many expenses
totalAmount: total of all included expenses
expenses: the list of expense records
```

This format is useful if you want to import your data into another app or share it with a developer.

### PDF Files

PDF exports create a formatted report that looks professional and prints well. The report includes:

- A header with the title and export date
- A summary bar showing total records and total amount
- A table of all included expenses with category colour coding
- Page numbers if there are many expenses

![Screenshot: PDF report showing the violet header bar, summary row, and expense table with coloured category labels](screenshots/advanced-export-pdf-preview.png)

---

## Common Questions

**Q: Where does the file go after I export?**
A: It goes to your browser's default Downloads folder — usually `~/Downloads` on a Mac or `C:\Users\You\Downloads` on Windows.

**Q: Can I export just one month of expenses?**
A: Yes — set the From date to the 1st of the month and the To date to the last day of the month in Step 3.

**Q: Can I export just one category?**
A: Yes — click the category pill in Step 3. You can select multiple categories at once.

**Q: Will the file include expenses I've already deleted?**
A: No. Only your current expenses are included.

**Q: Can I export multiple times with different filters?**
A: Yes — the dialog stays open after each export. Change your filters and export again.

**Q: The PDF looks different from the preview table. Why?**
A: The preview shows only the first 5 rows as a sample. The actual PDF always includes all matching records.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| "Export Data" button not visible | No expenses added yet | Add at least one expense first |
| Export button shows 0 records | Filters are too narrow | Widen the date range or select more categories |
| PDF export takes a long time | Large number of expenses | Wait a few seconds; PDFs with 100+ rows take longer to generate |
| File didn't appear in Downloads | Browser blocked the download | Check your browser's download bar or allow downloads from this site |
| CSV looks garbled in Excel | Encoding issue | When opening in Excel, choose "UTF-8" encoding during the import wizard |

---

## Related Guides

- **Developer documentation:** [`docs/dev/advanced-export-modal.md`](../dev/advanced-export-modal.md)
- **Full code analysis (all versions):** [`code-analysis.md`](../../code-analysis.md)
