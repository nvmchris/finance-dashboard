import {
  addMonths,
  balanceSeries,
  cashFlow,
  listMonths,
  monthsEndingAt,
  relativeChange,
  spendingByCategory,
  summarise,
} from './stats';
import type { Transaction } from './types';

let nextId = 0;
const tx = (date: string, amount: number, categoryId = 'groceries'): Transaction => ({
  id: String(nextId++),
  date,
  description: 'test',
  amount,
  categoryId,
});

const TRANSACTIONS = [
  tx('2026-01-01', 300000, 'salary'),
  tx('2026-01-03', -5000),
  tx('2026-01-03', -2500, 'dining'),
  tx('2026-02-10', -10000),
];

describe('addMonths', () => {
  it('crosses year boundaries in both directions', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-06', 0)).toBe('2026-06');
  });
});

test('monthsEndingAt lists months oldest first', () => {
  expect(monthsEndingAt('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']);
});

test('listMonths returns distinct months newest first', () => {
  expect(listMonths(TRANSACTIONS)).toEqual(['2026-02', '2026-01']);
});

describe('summarise', () => {
  it('splits income and expenses and computes the savings rate', () => {
    expect(summarise(TRANSACTIONS.slice(0, 3))).toEqual({
      income: 300000,
      expenses: 7500,
      net: 292500,
      savingsRate: 0.975,
    });
  });

  it('has no savings rate without income', () => {
    expect(summarise([tx('2026-01-01', -100)]).savingsRate).toBeNull();
  });
});

test('cashFlow includes empty months', () => {
  const flow = cashFlow(TRANSACTIONS, ['2026-01', '2026-02', '2026-03']);
  expect(flow.map((p) => p.expenses)).toEqual([7500, 10000, 0]);
  expect(flow[0].income).toBe(300000);
});

test('spendingByCategory ignores income and sorts descending', () => {
  expect(spendingByCategory(TRANSACTIONS)).toEqual([
    { categoryId: 'groceries', total: 15000 },
    { categoryId: 'dining', total: 2500 },
  ]);
});

test('balanceSeries accumulates per day in date order', () => {
  expect(balanceSeries([...TRANSACTIONS].reverse(), 1000)).toEqual([
    { date: '2026-01-01', balance: 301000 },
    { date: '2026-01-03', balance: 293500 },
    { date: '2026-02-10', balance: 283500 },
  ]);
});

test('relativeChange handles a zero baseline', () => {
  expect(relativeChange(150, 100)).toBe(0.5);
  expect(relativeChange(50, 0)).toBeNull();
});
