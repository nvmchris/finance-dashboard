import type { AppData, Cents, Theme, Transaction } from '../lib/types';

export type Action =
  | { type: 'import'; transactions: Transaction[] }
  | { type: 'updateTransaction'; id: string; patch: Partial<Omit<Transaction, 'id'>> }
  | { type: 'deleteTransaction'; id: string }
  | { type: 'setBudget'; categoryId: string; limit: Cents }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'replace'; data: AppData };

function byDate(a: Transaction, b: Transaction): number {
  return a.date.localeCompare(b.date);
}

export function reducer(data: AppData, action: Action): AppData {
  switch (action.type) {
    case 'import':
      return {
        ...data,
        transactions: [...data.transactions, ...action.transactions].sort(byDate),
      };
    case 'updateTransaction':
      return {
        ...data,
        transactions: data.transactions
          .map((t) => (t.id === action.id ? { ...t, ...action.patch } : t))
          .sort(byDate),
      };
    case 'deleteTransaction':
      return { ...data, transactions: data.transactions.filter((t) => t.id !== action.id) };
    case 'setBudget': {
      const budgets = data.budgets.filter((b) => b.categoryId !== action.categoryId);
      // A limit of zero removes the budget.
      if (action.limit > 0) budgets.push({ categoryId: action.categoryId, limit: action.limit });
      return { ...data, budgets };
    }
    case 'setTheme':
      return { ...data, settings: { ...data.settings, theme: action.theme } };
    case 'replace':
      return action.data;
  }
}
