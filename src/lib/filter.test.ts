import { filterTransactions, NO_FILTER, sortTransactions } from './filter';
import type { Transaction } from './types';

const TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2026-03-01', description: 'Salary ACME', amount: 300000, categoryId: 'salary' },
  {
    id: '2',
    date: '2026-03-02',
    description: 'REWE Markt',
    amount: -4510,
    categoryId: 'groceries',
  },
  { id: '3', date: '2026-03-05', description: 'Pizzeria', amount: -1800, categoryId: 'dining' },
];
const ids = (list: Transaction[]) => list.map((t) => t.id).join('');

describe('filterTransactions', () => {
  it('returns everything without a filter', () => {
    expect(ids(filterTransactions(TRANSACTIONS, NO_FILTER))).toBe('123');
  });

  it('searches descriptions case-insensitively', () => {
    expect(ids(filterTransactions(TRANSACTIONS, { ...NO_FILTER, query: ' rewe ' }))).toBe('2');
  });

  it('filters by category and kind', () => {
    expect(ids(filterTransactions(TRANSACTIONS, { ...NO_FILTER, categoryId: 'dining' }))).toBe('3');
    expect(ids(filterTransactions(TRANSACTIONS, { ...NO_FILTER, kind: 'income' }))).toBe('1');
    expect(ids(filterTransactions(TRANSACTIONS, { ...NO_FILTER, kind: 'expense' }))).toBe('23');
  });
});

describe('sortTransactions', () => {
  it('sorts by date, amount and description in both directions', () => {
    expect(ids(sortTransactions(TRANSACTIONS, { key: 'date', descending: true }))).toBe('321');
    expect(ids(sortTransactions(TRANSACTIONS, { key: 'amount', descending: false }))).toBe('231');
    expect(ids(sortTransactions(TRANSACTIONS, { key: 'description', descending: false }))).toBe(
      '321',
    );
  });

  it('does not mutate its input', () => {
    sortTransactions(TRANSACTIONS, { key: 'amount', descending: true });
    expect(ids(TRANSACTIONS)).toBe('123');
  });
});
