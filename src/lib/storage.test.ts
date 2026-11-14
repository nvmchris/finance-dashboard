import { categorise, DEFAULT_RULES, INCOME_OTHER_ID, UNCATEGORISED_ID } from './categories';
import { createSampleData } from './sample';
import { emptyData, loadData, parseData, saveData, STORAGE_KEY } from './storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips data through localStorage', () => {
    const data = createSampleData(new Date(2026, 5, 15));
    saveData(data);
    expect(loadData()).toEqual(data);
  });

  it('falls back to empty data when storage is missing or corrupt', () => {
    expect(loadData()).toEqual(emptyData());
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadData()).toEqual(emptyData());
  });

  it('rejects files that are not backups', () => {
    expect(() => parseData('[]')).toThrow('not a Saldo backup');
    expect(() => parseData('nope')).toThrow('not valid JSON');
  });
});

describe('createSampleData', () => {
  const today = new Date(2026, 5, 15);

  it('is deterministic and never dated in the future', () => {
    const data = createSampleData(today);
    expect(createSampleData(today)).toEqual(data);
    expect(data.transactions.length).toBeGreaterThan(100);
    expect(data.transactions.every((t) => t.date <= '2026-06-15')).toBe(true);
  });

  it('only uses known categories', () => {
    const data = createSampleData(today);
    const ids = new Set(data.categories.map((c) => c.id));
    expect(data.transactions.every((t) => ids.has(t.categoryId))).toBe(true);
    expect(data.budgets.every((b) => ids.has(b.categoryId))).toBe(true);
  });
});

describe('categorise', () => {
  it('matches keywords case-insensitively', () => {
    expect(categorise('REWE Markt 123', -2000, DEFAULT_RULES)).toBe('groceries');
    expect(categorise('Netflix.com', -1399, DEFAULT_RULES)).toBe('subscriptions');
  });

  it('falls back by sign of the amount', () => {
    expect(categorise('Unknown shop', -100, DEFAULT_RULES)).toBe(UNCATEGORISED_ID);
    expect(categorise('Refund', 100, DEFAULT_RULES)).toBe(INCOME_OTHER_ID);
  });
});
