import { formatDate, formatMoney, formatMonth, formatPercent, toIsoDate } from './format';

test('formatMoney converts cents to currency', () => {
  expect(formatMoney(123456, 'EUR', 'en-US')).toBe('€1,234.56');
  expect(formatMoney(-500, 'USD', 'en-US')).toBe('-$5.00');
});

test('formatMonth supports long and short styles', () => {
  expect(formatMonth('2026-03', 'en-US')).toBe('March 2026');
  expect(formatMonth('2026-03', 'en-US', 'short')).toBe('Mar');
});

test('formatDate is timezone independent', () => {
  expect(formatDate('2026-01-01', 'en-US')).toBe('Jan 1, 2026');
});

test('formatPercent rounds to whole percent', () => {
  expect(formatPercent(0.256, 'en-US')).toBe('26%');
});

test('toIsoDate pads month and day', () => {
  expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
});
