/** Money is stored as integer cents to avoid floating point drift. */
export type Cents = number;

/** ISO calendar date, `YYYY-MM-DD`. */
export type IsoDate = string;

/** Calendar month, `YYYY-MM`. */
export type MonthKey = string;

export type CategoryKind = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
}

export interface Transaction {
  id: string;
  date: IsoDate;
  description: string;
  /** Signed: income is positive, spending is negative. */
  amount: Cents;
  categoryId: string;
}

export interface Budget {
  categoryId: string;
  /** Monthly spending limit, positive. */
  limit: Cents;
}

/** Assigns `categoryId` to transactions whose description contains `keyword`. */
export interface Rule {
  keyword: string;
  categoryId: string;
}

export type Theme = 'light' | 'dark';

export interface Settings {
  currency: string;
  theme: Theme | null;
}

export interface AppData {
  version: 1;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  rules: Rule[];
  settings: Settings;
}
