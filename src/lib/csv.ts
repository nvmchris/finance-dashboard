import { categorise } from './categories';
import type { Cents, IsoDate, Rule, Transaction } from './types';

const DELIMITERS = [';', ',', '\t'] as const;
const QUOTE = '"';
const BOM = '﻿';

/** Picks the delimiter that occurs most often in the header line. */
export function detectDelimiter(text: string): string {
  const header = text.split(/\r?\n/, 1)[0] ?? '';
  let best: string = DELIMITERS[0];
  let bestCount = 0;
  for (const delimiter of DELIMITERS) {
    const count = header.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

/** RFC 4180-style parser: quoted fields, escaped quotes, CRLF and embedded newlines. */
export function parseCsv(input: string, delimiter = detectDelimiter(input)): string[][] {
  const text = input.startsWith(BOM) ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const endField = () => {
    row.push(field.trim());
    field = '';
  };
  const endRow = () => {
    endField();
    if (row.some((cell) => cell !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== QUOTE) field += char;
      else if (text[i + 1] === QUOTE) {
        field += QUOTE;
        i++;
      } else quoted = false;
    } else if (char === QUOTE) quoted = true;
    else if (char === delimiter) endField();
    else if (char === '\n') endRow();
    else if (char !== '\r') field += char;
  }
  endRow();
  return rows;
}

const CENTS_PER_UNIT = 100;

/**
 * Parses amounts in German (`1.234,56`) and English (`1,234.56`) notation,
 * with currency symbols, a trailing minus or accounting parentheses.
 */
export function parseAmount(raw: string): Cents | null {
  let text = raw.replace(/[^\d.,()+-]/g, '');
  if (!/\d/.test(text)) return null;

  const negative = text.includes('-') || (text.startsWith('(') && text.endsWith(')'));
  text = text.replace(/[()+-]/g, '');

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);
  const decimals = decimalIndex === -1 ? 0 : text.length - decimalIndex - 1;
  // A separator followed by exactly three digits is a thousands separator ("1.234").
  const hasDecimalPart = decimalIndex !== -1 && decimals !== 3;

  const whole = (hasDecimalPart ? text.slice(0, decimalIndex) : text).replace(/[.,]/g, '');
  const fraction = hasDecimalPart ? text.slice(decimalIndex + 1) : '';
  const value = Number(`${whole || '0'}.${fraction || '0'}`);
  if (!Number.isFinite(value)) return null;

  const cents = Math.round(value * CENTS_PER_UNIT);
  return negative ? -cents : cents;
}

const CENTURY = 2000;
const MAX_MONTH = 12;

function isoDate(year: number, month: number, day: number): IsoDate | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!valid) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Parses `YYYY-MM-DD`, `DD.MM.YYYY`, `DD/MM/YYYY` and `MM/DD/YYYY` (two-digit years allowed). */
export function parseDate(raw: string): IsoDate | null {
  const text = raw.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (iso) return isoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const parts = /^(\d{1,2})([./-])(\d{1,2})\2(\d{2}|\d{4})$/.exec(text);
  if (!parts) return null;
  const first = Number(parts[1]);
  const second = Number(parts[3]);
  const year = parts[4].length === 2 ? CENTURY + Number(parts[4]) : Number(parts[4]);
  // Day-first is the default; only an impossible month flips to US order.
  const monthFirst = parts[2] === '/' && second > MAX_MONTH && first <= MAX_MONTH;
  return monthFirst ? isoDate(year, first, second) : isoDate(year, second, first);
}

export interface ColumnMap {
  date: number;
  description: number[];
  /** Single signed amount column, or separate debit/credit columns. */
  amount?: number;
  debit?: number;
  credit?: number;
}

const HEADER_KEYWORDS = {
  date: ['buchungstag', 'buchungsdatum', 'datum', 'date', 'valuta'],
  description: [
    'verwendungszweck',
    'buchungstext',
    'beschreibung',
    'description',
    'empfänger',
    'auftraggeber',
    'payee',
    'merchant',
    'name',
    'memo',
    'text',
    'details',
  ],
  amount: ['betrag', 'amount', 'umsatz', 'value'],
  debit: ['soll', 'debit', 'ausgabe', 'withdrawal'],
  credit: ['haben', 'credit', 'eingang', 'deposit'],
} as const;

function findColumns(header: string[], keywords: readonly string[]): number[] {
  const cells = header.map((cell) => cell.toLowerCase());
  const found: number[] = [];
  for (const keyword of keywords) {
    cells.forEach((cell, index) => {
      if (cell.includes(keyword) && !found.includes(index)) found.push(index);
    });
  }
  return found;
}

/** Maps header names to columns; throws when a required column is missing. */
export function detectColumns(header: string[]): ColumnMap {
  const [date] = findColumns(header, HEADER_KEYWORDS.date);
  const [debit] = findColumns(header, HEADER_KEYWORDS.debit);
  const [credit] = findColumns(header, HEADER_KEYWORDS.credit);
  const [amount] = findColumns(header, HEADER_KEYWORDS.amount);
  const taken = [date, debit, credit, amount];
  const description = findColumns(header, HEADER_KEYWORDS.description).filter(
    (index) => !taken.includes(index),
  );

  if (date === undefined) throw new Error('No date column found in the CSV header.');
  if (amount === undefined && debit === undefined && credit === undefined) {
    throw new Error('No amount column found in the CSV header.');
  }
  if (description.length === 0) throw new Error('No description column found in the CSV header.');
  return { date, description, amount, debit, credit };
}

function readAmount(row: string[], columns: ColumnMap): Cents | null {
  if (columns.amount !== undefined) {
    const amount = parseAmount(row[columns.amount] ?? '');
    if (amount !== null) return amount;
  }
  const debit = columns.debit === undefined ? null : parseAmount(row[columns.debit] ?? '');
  const credit = columns.credit === undefined ? null : parseAmount(row[columns.credit] ?? '');
  if (debit === null && credit === null) return null;
  return Math.abs(credit ?? 0) - Math.abs(debit ?? 0);
}

/** Identity of a transaction for duplicate detection across imports. */
export function fingerprint(t: Pick<Transaction, 'date' | 'amount' | 'description'>): string {
  return `${t.date}|${t.amount}|${t.description.toLowerCase().replace(/\s+/g, ' ')}`;
}

export interface ImportResult {
  transactions: Transaction[];
  /** Rows without a readable date or amount. */
  invalid: number;
  /** Rows already present in `existing`. */
  duplicates: number;
}

export function importCsv(
  text: string,
  rules: Rule[],
  existing: Transaction[] = [],
  createId: () => string = () => crypto.randomUUID(),
): ImportResult {
  const [header, ...rows] = parseCsv(text);
  if (!header) throw new Error('The CSV file is empty.');
  const columns = detectColumns(header);

  // Counted, so two genuinely identical purchases on one day both survive a first import.
  const known = new Map<string, number>();
  for (const t of existing) known.set(fingerprint(t), (known.get(fingerprint(t)) ?? 0) + 1);

  const result: ImportResult = { transactions: [], invalid: 0, duplicates: 0 };
  for (const row of rows) {
    const date = parseDate(row[columns.date] ?? '');
    const amount = readAmount(row, columns);
    if (date === null || amount === null) {
      result.invalid++;
      continue;
    }
    const description =
      columns.description
        .map((index) => row[index])
        .filter(Boolean)
        .join(' · ') || 'Unnamed transaction';
    const key = fingerprint({ date, amount, description });
    const seen = known.get(key) ?? 0;
    if (seen > 0) {
      known.set(key, seen - 1);
      result.duplicates++;
      continue;
    }
    result.transactions.push({
      id: createId(),
      date,
      description,
      amount,
      categoryId: categorise(description, amount, rules),
    });
  }
  return result;
}

function escapeCell(value: string): string {
  return /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Exports transactions as CSV that `importCsv` can read back. */
export function exportCsv(transactions: Transaction[], categoryName: (id: string) => string) {
  const lines = transactions.map((t) =>
    [
      t.date,
      escapeCell(t.description),
      (t.amount / CENTS_PER_UNIT).toFixed(2),
      escapeCell(categoryName(t.categoryId)),
    ].join(','),
  );
  return ['Date,Description,Amount,Category', ...lines].join('\n');
}
