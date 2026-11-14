import { categorise, INCOME_OTHER_ID, UNCATEGORISED_ID } from '../lib/categories';
import type { AppData, Cents, Rule, Theme, Transaction } from '../lib/types';

export type Action =
  | { type: 'import'; transactions: Transaction[] }
  | { type: 'updateTransaction'; id: string; patch: Partial<Omit<Transaction, 'id'>> }
  | { type: 'deleteTransaction'; id: string }
  | { type: 'setBudget'; categoryId: string; limit: Cents }
  | { type: 'setTheme'; theme: Theme }
  | { type: 'setCurrency'; currency: string }
  | { type: 'addRule'; rule: Rule }
  | { type: 'removeRule'; keyword: string }
  | { type: 'applyRules' }
  | { type: 'replace'; data: AppData };

const FALLBACK_CATEGORIES = [UNCATEGORISED_ID, INCOME_OTHER_ID];

function sameKeyword(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

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
    case 'setCurrency':
      return { ...data, settings: { ...data.settings, currency: action.currency } };
    case 'addRule': {
      const others = data.rules.filter((r) => !sameKeyword(r.keyword, action.rule.keyword));
      // Newest first, so a user's rule wins over the built-in ones.
      return {
        ...data,
        rules: [{ ...action.rule, keyword: action.rule.keyword.trim() }, ...others],
      };
    }
    case 'removeRule':
      return { ...data, rules: data.rules.filter((r) => !sameKeyword(r.keyword, action.keyword)) };
    case 'applyRules':
      // Only touch transactions nobody has categorised yet; manual choices stay.
      return {
        ...data,
        transactions: data.transactions.map((t) =>
          FALLBACK_CATEGORIES.includes(t.categoryId)
            ? { ...t, categoryId: categorise(t.description, t.amount, data.rules) }
            : t,
        ),
      };
    case 'replace':
      return action.data;
  }
}
