'use client';

import { useState, useRef, useEffect } from 'react';
import { Expense } from '../types/expense';
import { exportCSV, exportJSON } from '../lib/exportUtils';
import { Download, FileText, FileJson, ChevronDown } from 'lucide-react';

interface Props {
  expenses: Expense[];
}

export default function ExportMenu({ expenses }: Props) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function run(label: string, fn: () => void) {
    fn();
    setFlash(label);
    setOpen(false);
    setTimeout(() => setFlash(null), 2000);
  }

  if (expenses.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Download size={14} />
        {flash ? <span className="text-emerald-600">{flash} ✓</span> : 'Export'}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-10">
          <button
            onClick={() => run('CSV', () => exportCSV(expenses))}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileText size={14} className="text-emerald-500" />
            Export as CSV
          </button>
          <button
            onClick={() => run('JSON', () => exportJSON(expenses))}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileJson size={14} className="text-blue-500" />
            Export as JSON
          </button>
        </div>
      )}
    </div>
  );
}
