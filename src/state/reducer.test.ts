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

  it('sets the currency', () => {
    expect(reducer(base, { type: 'setCurrency', currency: 'USD' }).settings.currency).toBe('USD');
  });

  it('adds rules in front, replaces duplicates and removes them', () => {
    let data = reducer(base, {
      type: 'addRule',
      rule: { keyword: ' Bäckerei ', categoryId: 'dining' },
    });
    expect(data.rules[0]).toEqual({ keyword: 'Bäckerei', categoryId: 'dining' });

    data = reducer(data, {
      type: 'addRule',
      rule: { keyword: 'bäckerei', categoryId: 'groceries' },
    });
    expect(data.rules.filter((r) => r.keyword.toLowerCase() === 'bäckerei')).toEqual([
      { keyword: 'bäckerei', categoryId: 'groceries' },
    ]);

    data = reducer(data, { type: 'removeRule', keyword: 'BÄCKEREI' });
    expect(data.rules).toEqual(base.rules);
  });

  it('applies rules only to uncategorised transactions', () => {
    const data = {
      ...base,
      transactions: [
        { ...tx('a', '2026-01-01'), description: 'Bäckerei Huber', categoryId: 'uncategorised' },
        { ...tx('b', '2026-01-02'), description: 'Bäckerei Huber', categoryId: 'leisure' },
      ],
      rules: [{ keyword: 'bäckerei', categoryId: 'dining' }],
    };
    const next = reducer(data, { type: 'applyRules' });
    expect(next.transactions.map((t) => t.categoryId)).toEqual(['dining', 'leisure']);
  });
});
