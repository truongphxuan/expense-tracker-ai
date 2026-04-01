'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense, ExpenseFormData, Category } from '../types/expense';
import { loadExpenses, saveExpenses, generateId } from '../lib/storage';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setExpenses(loadExpenses());
    setIsLoaded(true);
  }, []);

  const persist = useCallback((updated: Expense[]) => {
    setExpenses(updated);
    saveExpenses(updated);
  }, []);

  const addExpense = useCallback(
    (data: ExpenseFormData) => {
      const expense: Expense = {
        id: generateId(),
        date: data.date,
        amount: parseFloat(data.amount),
        category: data.category as Category,
        description: data.description.trim(),
        createdAt: new Date().toISOString(),
      };
      persist([expense, ...expenses]);
    },
    [expenses, persist]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseFormData) => {
      persist(
        expenses.map((e) =>
          e.id === id
            ? {
                ...e,
                date: data.date,
                amount: parseFloat(data.amount),
                category: data.category as Category,
                description: data.description.trim(),
              }
            : e
        )
      );
    },
    [expenses, persist]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persist(expenses.filter((e) => e.id !== id));
    },
    [expenses, persist]
  );

  return { expenses, isLoaded, addExpense, updateExpense, deleteExpense };
}
