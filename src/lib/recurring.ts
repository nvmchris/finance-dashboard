import { monthOf } from './stats';
import type { Cents, IsoDate, MonthKey, Transaction } from './types';

/** A payee must show up in at least this many different months. */
const MIN_MONTHS = 3;
/** Largest allowed spread between the smallest and largest charge, relative to the median. */
const AMOUNT_TOLERANCE = 0.2;
/** One skipped month is tolerated (a late or early charge slipping across a month end). */
const MAX_GAP_MONTHS = 1;
const MONTHS_PER_YEAR = 12;

export interface RecurringPayment {
  name: string;
  categoryId: string;
  /** Typical charge (median), positive. */
  amount: Cents;
  occurrences: number;
  lastDate: IsoDate;
}

function monthIndex(month: MonthKey): number {
  const [year, monthNumber] = month.split('-').map(Number);
  return year * MONTHS_PER_YEAR + monthNumber;
}

/** Strips reference numbers and punctuation so "NETFLIX 4711" and "Netflix" group together. */
export function payeeKey(description: string): string {
  return description
    .toLowerCase()
    .replace(/[\d.,/*#:_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/**
 * Finds payments charged about once a month for a similar amount, still running
 * as of `month`. Everyday spending at the same shop is excluded because it
 * occurs several times a month or varies too much.
 */
export function detectRecurring(transactions: Transaction[], month: MonthKey): RecurringPayment[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.amount >= 0 || monthOf(t.date) > month) continue;
    const key = payeeKey(t.description);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const recurring: RecurringPayment[] = [];
  for (const group of groups.values()) {
    const months = new Set(group.map((t) => monthIndex(monthOf(t.date))));
    if (months.size < MIN_MONTHS || group.length !== months.size) continue;

    const first = Math.min(...months);
    const last = Math.max(...months);
    if (last - first + 1 - months.size > MAX_GAP_MONTHS) continue;
    if (monthIndex(month) - last > MAX_GAP_MONTHS) continue; // cancelled

    const amounts = group.map((t) => -t.amount);
    const typical = median(amounts);
    if ((Math.max(...amounts) - Math.min(...amounts)) / typical > AMOUNT_TOLERANCE) continue;

    const latest = group.reduce((a, b) => (b.date > a.date ? b : a));
    recurring.push({
      name: latest.description,
      categoryId: latest.categoryId,
      amount: typical,
      occurrences: group.length,
      lastDate: latest.date,
    });
  }
  return recurring.sort((a, b) => b.amount - a.amount);
}

export function yearlyCost(payments: RecurringPayment[]): Cents {
  return payments.reduce((sum, p) => sum + p.amount, 0) * MONTHS_PER_YEAR;
}
