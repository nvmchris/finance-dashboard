import { DEFAULT_RULES } from './categories';
import {
  detectColumns,
  detectDelimiter,
  exportCsv,
  importCsv,
  parseAmount,
  parseCsv,
  parseDate,
} from './csv';

describe('parseCsv', () => {
  it('detects the delimiter from the header', () => {
    expect(detectDelimiter('a;b;c\n1,5;2;3')).toBe(';');
    expect(detectDelimiter('a,b,c')).toBe(',');
    expect(detectDelimiter('a\tb')).toBe('\t');
  });

  it('handles quotes, escaped quotes, embedded newlines and CRLF', () => {
    const text = '﻿name,note\r\n"Doe, Jane","said ""hi""\nthere"\r\n\r\nx,y\r\n';
    expect(parseCsv(text)).toEqual([
      ['name', 'note'],
      ['Doe, Jane', 'said "hi"\nthere'],
      ['x', 'y'],
    ]);
  });
});

describe('parseAmount', () => {
  it.each([
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    ['-12,50 €', -1250],
    ['12,50-', -1250],
    ['(12.50)', -1250],
    ['$1,000', 100000],
    ['1.000', 100000],
    ['+7', 700],
    ['0,5', 50],
    ['19.99', 1999],
  ])('parses %s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it('returns null for text without digits', () => {
    expect(parseAmount('n/a')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });
});

describe('parseDate', () => {
  it.each([
    ['2026-03-07', '2026-03-07'],
    ['2026-03-07T10:00:00', '2026-03-07'],
    ['07.03.2026', '2026-03-07'],
    ['7.3.26', '2026-03-07'],
    ['07/03/2026', '2026-03-07'],
    ['03/25/2026', '2026-03-25'],
  ])('parses %s', (input, expected) => {
    expect(parseDate(input)).toBe(expected);
  });

  it('rejects impossible dates', () => {
    expect(parseDate('31.02.2026')).toBeNull();
    expect(parseDate('yesterday')).toBeNull();
  });
});

describe('detectColumns', () => {
  it('maps German bank headers', () => {
    const header = [
      'Buchungstag',
      'Valuta',
      'Auftraggeber/Empfänger',
      'Verwendungszweck',
      'Betrag',
    ];
    expect(detectColumns(header)).toEqual({
      date: 0,
      description: [3, 2],
      amount: 4,
      debit: undefined,
      credit: undefined,
    });
  });

  it('supports separate debit and credit columns', () => {
    const columns = detectColumns(['Date', 'Description', 'Debit', 'Credit']);
    expect(columns).toMatchObject({ date: 0, description: [1], debit: 2, credit: 3 });
  });

  it('fails fast with a clear message', () => {
    expect(() => detectColumns(['foo', 'Betrag', 'Text'])).toThrow('No date column');
    expect(() => detectColumns(['Datum', 'Text'])).toThrow('No amount column');
    expect(() => detectColumns(['Datum', 'Betrag'])).toThrow('No description column');
  });
});

describe('importCsv', () => {
  let counter = 0;
  const createId = () => `id-${counter++}`;
  const CSV = [
    'Buchungstag;Verwendungszweck;Betrag',
    '01.03.2026;Gehalt März;3.240,00',
    '02.03.2026;REWE Markt;-45,10',
    '02.03.2026;REWE Markt;-45,10',
    'kaputt;Zeile;-1,00',
  ].join('\n');

  it('imports, categorises and counts invalid rows', () => {
    const result = importCsv(CSV, DEFAULT_RULES, [], createId);
    expect(result.invalid).toBe(1);
    expect(result.duplicates).toBe(0);
    expect(result.transactions.map((t) => [t.date, t.amount, t.categoryId])).toEqual([
      ['2026-03-01', 324000, 'salary'],
      ['2026-03-02', -4510, 'groceries'],
      ['2026-03-02', -4510, 'groceries'],
    ]);
  });

  it('skips rows that were already imported', () => {
    const first = importCsv(CSV, DEFAULT_RULES, [], createId);
    const second = importCsv(CSV, DEFAULT_RULES, first.transactions, createId);
    expect(second.transactions).toEqual([]);
    expect(second.duplicates).toBe(3);
  });

  it('reads debit and credit columns', () => {
    const csv = 'Date,Description,Debit,Credit\n2026-03-01,Coffee,3.50,\n2026-03-02,Refund,,10.00';
    const result = importCsv(csv, [], [], createId);
    expect(result.transactions.map((t) => t.amount)).toEqual([-350, 1000]);
  });

  it('rejects empty files', () => {
    expect(() => importCsv('', [])).toThrow('empty');
  });

  it('round-trips through exportCsv', () => {
    const { transactions } = importCsv(CSV, DEFAULT_RULES, [], createId);
    const exported = exportCsv(transactions, (id) => id);
    const again = importCsv(exported, DEFAULT_RULES, [], createId);
    expect(again.transactions.map((t) => [t.date, t.amount])).toEqual(
      transactions.map((t) => [t.date, t.amount]),
    );
  });
});
