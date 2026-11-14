import { emptyData } from '../lib/storage';
import type { Transaction } from '../lib/types';
import { reducer } from './reducer';

const tx = (id: string, date: string): Transaction => ({
  id,
  date,
  description: id,
  amount: -100,
  categoryId: 'groceries',
});

describe('reducer', () => {
  const base = { ...emptyData(), transactions: [tx('a', '2026-01-05')] };

  it('keeps transactions sorted by date on import', () => {
    const next = reducer(base, { type: 'import', transactions: [tx('b', '2026-01-01')] });
    expect(next.transactions.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('updates and deletes by id', () => {
    const updated = reducer(base, {
      type: 'updateTransaction',
      id: 'a',
      patch: { categoryId: 'dining' },
    });
    expect(updated.transactions[0].categoryId).toBe('dining');
    expect(reducer(base, { type: 'deleteTransaction', id: 'a' }).transactions).toEqual([]);
  });

  it('sets, replaces and removes budgets', () => {
    let data = reducer(base, { type: 'setBudget', categoryId: 'dining', limit: 5000 });
    data = reducer(data, { type: 'setBudget', categoryId: 'dining', limit: 8000 });
    expect(data.budgets).toEqual([{ categoryId: 'dining', limit: 8000 }]);
    expect(reducer(data, { type: 'setBudget', categoryId: 'dining', limit: 0 }).budgets).toEqual(
      [],
    );
  });

  it('stores the theme and replaces all data', () => {
    expect(reducer(base, { type: 'setTheme', theme: 'dark' }).settings.theme).toBe('dark');
    expect(reducer(base, { type: 'replace', data: emptyData() }).transactions).toEqual([]);
  });
});
