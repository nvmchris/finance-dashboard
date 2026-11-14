import { detectRecurring, payeeKey, yearlyCost } from './recurring';
import { createSampleData } from './sample';
import type { Transaction } from './types';

let nextId = 0;
const tx = (date: string, description: string, amount: number): Transaction => ({
  id: String(nextId++),
  date,
  description,
  amount,
  categoryId: 'subscriptions',
});
const monthly = (description: string, amounts: number[], startMonth = 1) =>
  amounts.map((amount, i) =>
    tx(`2026-${String(startMonth + i).padStart(2, '0')}-10`, description, -amount),
  );

test('payeeKey ignores reference numbers and punctuation', () => {
  expect(payeeKey('NETFLIX.COM 4711/22')).toBe(payeeKey('netflix com'));
});

describe('detectRecurring', () => {
  it('finds monthly charges with a stable amount', () => {
    const transactions = [
      ...monthly('Netflix', [1399, 1399, 1399, 1499]),
      ...monthly('Rent', [98000, 98000, 98000, 98000]),
    ];
    expect(detectRecurring(transactions, '2026-04')).toEqual([
      {
        name: 'Rent',
        categoryId: 'subscriptions',
        amount: 98000,
        occurrences: 4,
        lastDate: '2026-04-10',
      },
      {
        name: 'Netflix',
        categoryId: 'subscriptions',
        amount: 1399,
        occurrences: 4,
        lastDate: '2026-04-10',
      },
    ]);
  });

  it('ignores shops visited several times a month, varying amounts and income', () => {
    const transactions = [
      ...monthly('Billa', [2000, 2100, 1900]),
      tx('2026-01-20', 'Billa', -2000),
      ...monthly('Restaurant', [2000, 6000, 3000]),
      ...monthly('Salary', [-300000, -300000, -300000]),
      ...monthly('Too new', [500, 500]),
    ];
    expect(detectRecurring(transactions, '2026-03')).toEqual([]);
  });

  it('drops cancelled payments and ignores the future', () => {
    const transactions = monthly('Gym', [2990, 2990, 2990]);
    expect(detectRecurring(transactions, '2026-04')).toHaveLength(1);
    expect(detectRecurring(transactions, '2026-06')).toEqual([]);
    expect(detectRecurring(transactions, '2026-02')).toEqual([]);
  });

  it('tolerates one skipped month', () => {
    const transactions = [
      ...monthly('Spotify', [1099, 1099]),
      ...monthly('Spotify', [1099, 1099], 4),
    ];
    expect(detectRecurring(transactions, '2026-05')).toHaveLength(1);
  });

  it('finds the fixed costs in the demo data', () => {
    const { transactions } = createSampleData(new Date(2026, 5, 20));
    const names = detectRecurring(transactions, '2026-06').map((p) => p.name);
    expect(names).toEqual(
      expect.arrayContaining(['Rent Hausverwaltung Maier', 'Netflix', 'Spotify']),
    );
    expect(names).not.toContain('Billa');
  });
});

test('yearlyCost projects twelve months', () => {
  expect(yearlyCost(detectRecurring(monthly('Netflix', [1000, 1000, 1000]), '2026-03'))).toBe(
    12000,
  );
});
