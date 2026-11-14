import { DEFAULT_CATEGORIES, DEFAULT_RULES } from './categories';
import type { AppData } from './types';

export const STORAGE_KEY = 'saldo:data:v1';
const DEFAULT_CURRENCY = 'EUR';

export function emptyData(): AppData {
  return {
    version: 1,
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    budgets: [],
    rules: DEFAULT_RULES,
    settings: { currency: DEFAULT_CURRENCY, theme: null },
  };
}

function isAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Partial<AppData>;
  return (
    data.version === 1 &&
    Array.isArray(data.transactions) &&
    Array.isArray(data.categories) &&
    Array.isArray(data.budgets) &&
    Array.isArray(data.rules) &&
    typeof data.settings === 'object' &&
    data.settings !== null
  );
}

/** Parses a JSON backup; throws with a clear message when the shape is wrong. */
export function parseData(json: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  if (!isAppData(parsed)) throw new Error('The file is not a Saldo backup.');
  return parsed;
}

/** Loads saved data; corrupt or missing data yields a fresh, empty state. */
export function loadData(storage: Pick<Storage, 'getItem'> = localStorage): AppData {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyData();
  try {
    return parseData(raw);
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}
