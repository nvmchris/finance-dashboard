import type { Cents, IsoDate, MonthKey, Transaction } from './types';

const MONTHS_PER_YEAR = 12;
const MONTH_KEY_LENGTH = 7;

export function monthOf(date: IsoDate): MonthKey {
  return date.slice(0, MONTH_KEY_LENGTH);
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [year, monthNumber] = month.split('-').map(Number);
  const index = year * MONTHS_PER_YEAR + (monthNumber - 1) + delta;
  const newYear = Math.floor(index / MONTHS_PER_YEAR);
  const newMonth = (index % MONTHS_PER_YEAR) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

/** The `count` months ending with `end`, oldest first. */
export function monthsEndingAt(end: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => addMonths(end, i - count + 1));
}

/** Distinct months that contain transactions, newest first. */
export function listMonths(transactions: Transaction[]): MonthKey[] {
  return [...new Set(transactions.map((t) => monthOf(t.date)))].sort().reverse();
}

export function inMonth(transactions: Transaction[], month: MonthKey): Transaction[] {
  return transactions.filter((t) => monthOf(t.date) === month);
}

export interface MonthSummary {
  income: Cents;
  /** Positive number. */
  expenses: Cents;
  net: Cents;
  /** Share of income kept, 0..1; `null` without income. */
  savingsRate: number | null;
}

export function summarise(transactions: Transaction[]): MonthSummary {
  let income = 0;
  let expenses = 0;
  for (const { amount } of transactions) {
    if (amount > 0) income += amount;
    else expenses -= amount;
  }
  const net = income - expenses;
  return { income, expenses, net, savingsRate: income > 0 ? net / income : null };
}

export interface CashFlowPoint extends MonthSummary {
  month: MonthKey;
}

export function cashFlow(transactions: Transaction[], months: MonthKey[]): CashFlowPoint[] {
  return months.map((month) => ({ month, ...summarise(inMonth(transactions, month)) }));
}

export interface CategoryTotal {
  categoryId: string;
  /** Positive number. */
  total: Cents;
}

/** Spending per category, largest first. Income is ignored. */
export function spendingByCategory(transactions: Transaction[]): CategoryTotal[] {
  const totals = new Map<string, Cents>();
  for (const { amount, categoryId } of transactions) {
    if (amount >= 0) continue;
    totals.set(categoryId, (totals.get(categoryId) ?? 0) - amount);
  }
  return [...totals]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}

export interface BalancePoint {
  date: IsoDate;
  balance: Cents;
}

/** Running balance with one point per day that has transactions. */
export function balanceSeries(transactions: Transaction[], opening: Cents = 0): BalancePoint[] {
  const perDay = new Map<IsoDate, Cents>();
  for (const { date, amount } of transactions) {
    perDay.set(date, (perDay.get(date) ?? 0) + amount);
  }
  let balance = opening;
  return [...perDay]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, change]) => ({ date, balance: (balance += change) }));
}

/** Relative change from `previous` to `current`; `null` when there is no baseline. */
export function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
