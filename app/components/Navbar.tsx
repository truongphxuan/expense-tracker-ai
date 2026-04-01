'use client';

import { Wallet } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-violet-600 rounded-lg">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base">Expense Tracker</span>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">Personal Finance Manager</span>
      </div>
    </header>
  );
}
