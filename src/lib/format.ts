import type { Cents, IsoDate, MonthKey } from './types';

const CENTS_PER_UNIT = 100;

export function formatMoney(amount: Cents, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    amount / CENTS_PER_UNIT,
  );
}

/** Compact amount without decimals, for chart axes. */
export function formatMoneyShort(amount: Cents, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount / CENTS_PER_UNIT);
}

export function formatMonth(month: MonthKey, locale?: string, style: 'long' | 'short' = 'long') {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1, 1));
  const options: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { month: 'short', timeZone: 'UTC' };
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDate(date: IsoDate, locale?: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function formatPercent(ratio: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
    ratio,
  );
}

export function toIsoDate(date: Date): IsoDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
