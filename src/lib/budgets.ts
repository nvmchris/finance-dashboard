import { spendingByCategory } from './stats';
import type { Budget, Cents, Transaction } from './types';

/** Share of the limit at which a budget counts as "close". */
export const WARNING_RATIO = 0.8;

export type BudgetStatus = 'ok' | 'warning' | 'over';

export interface BudgetProgress extends Budget {
  spent: Cents;
  /** Negative when over budget. */
  remaining: Cents;
  /** Spent divided by limit; may exceed 1. */
  ratio: number;
  status: BudgetStatus;
}

function statusOf(ratio: number): BudgetStatus {
  if (ratio > 1) return 'over';
  return ratio >= WARNING_RATIO ? 'warning' : 'ok';
}

/** Progress of each budget against one month of transactions, most used first. */
export function budgetProgress(budgets: Budget[], transactions: Transaction[]): BudgetProgress[] {
  const spentBy = new Map(spendingByCategory(transactions).map((t) => [t.categoryId, t.total]));
  return budgets
    .map((budget) => {
      const spent = spentBy.get(budget.categoryId) ?? 0;
      const ratio = spent / budget.limit;
      return { ...budget, spent, remaining: budget.limit - spent, ratio, status: statusOf(ratio) };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export interface BudgetTotals {
  limit: Cents;
  spent: Cents;
  remaining: Cents;
}

export function budgetTotals(progress: BudgetProgress[]): BudgetTotals {
  const limit = progress.reduce((sum, p) => sum + p.limit, 0);
  const spent = progress.reduce((sum, p) => sum + p.spent, 0);
  return { limit, spent, remaining: limit - spent };
}
