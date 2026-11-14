import { budgetProgress, budgetTotals } from './budgets';
import type { Transaction } from './types';

const tx = (amount: number, categoryId: string): Transaction => ({
  id: `${categoryId}${amount}`,
  date: '2026-03-01',
  description: 'x',
  amount,
  categoryId,
});

const BUDGETS = [
  { categoryId: 'groceries', limit: 10000 },
  { categoryId: 'dining', limit: 5000 },
  { categoryId: 'leisure', limit: 4000 },
];
const TRANSACTIONS = [
  tx(-3000, 'groceries'),
  tx(-4000, 'dining'),
  tx(-4500, 'leisure'),
  tx(900000, 'salary'),
];

test('budgetProgress classifies and sorts by usage', () => {
  const progress = budgetProgress(BUDGETS, TRANSACTIONS);
  expect(progress.map((p) => [p.categoryId, p.status])).toEqual([
    ['leisure', 'over'],
    ['dining', 'warning'],
    ['groceries', 'ok'],
  ]);
  expect(progress[0]).toMatchObject({ spent: 4500, remaining: -500, ratio: 1.125 });
});

test('a budget without spending is untouched', () => {
  expect(budgetProgress(BUDGETS, [])[0]).toMatchObject({ spent: 0, ratio: 0, status: 'ok' });
});

test('budgetTotals sums limits and spending', () => {
  expect(budgetTotals(budgetProgress(BUDGETS, TRANSACTIONS))).toEqual({
    limit: 19000,
    spent: 11500,
    remaining: 7500,
  });
});
