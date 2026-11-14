import type { Category, Rule } from './types';

export const UNCATEGORISED_ID = 'uncategorised';
export const INCOME_OTHER_ID = 'income-other';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', color: '#0f9d76', kind: 'income' },
  { id: INCOME_OTHER_ID, name: 'Other income', color: '#4cc9a4', kind: 'income' },
  { id: 'housing', name: 'Housing', color: '#5b6ef5', kind: 'expense' },
  { id: 'groceries', name: 'Groceries', color: '#f59e0b', kind: 'expense' },
  { id: 'dining', name: 'Dining out', color: '#ef4444', kind: 'expense' },
  { id: 'transport', name: 'Transport', color: '#06b6d4', kind: 'expense' },
  { id: 'utilities', name: 'Utilities', color: '#8b5cf6', kind: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#ec4899', kind: 'expense' },
  { id: 'shopping', name: 'Shopping', color: '#f97316', kind: 'expense' },
  { id: 'health', name: 'Health', color: '#14b8a6', kind: 'expense' },
  { id: 'leisure', name: 'Leisure', color: '#a3e635', kind: 'expense' },
  { id: UNCATEGORISED_ID, name: 'Uncategorised', color: '#94a3b8', kind: 'expense' },
];

const KEYWORDS: Record<string, string[]> = {
  salary: ['salary', 'gehalt', 'lohn', 'payroll'],
  housing: ['rent', 'miete', 'mortgage', 'hausverwaltung'],
  groceries: ['rewe', 'aldi', 'lidl', 'edeka', 'spar', 'billa', 'hofer', 'tesco', 'supermarket'],
  dining: [
    'restaurant',
    'cafe',
    'pizza',
    'burger',
    'mcdonald',
    'lieferando',
    'uber eats',
    'bakery',
  ],
  transport: ['uber', 'bahn', 'öbb', 'oebb', 'shell', 'omv', 'tankstelle', 'parking', 'transit'],
  utilities: [
    'strom',
    'electric',
    'gas',
    'wasser',
    'water',
    'internet',
    'telekom',
    'vodafone',
    'a1 ',
  ],
  subscriptions: ['netflix', 'spotify', 'disney', 'youtube', 'icloud', 'github', 'prime'],
  shopping: ['amazon', 'zalando', 'ikea', 'h&m', 'mediamarkt', 'ebay'],
  health: ['apotheke', 'pharmacy', 'doctor', 'arzt', 'dentist', 'gym', 'fitness'],
  leisure: ['cinema', 'kino', 'steam', 'ticket', 'museum', 'concert', 'booking.com', 'airbnb'],
};

export const DEFAULT_RULES: Rule[] = Object.entries(KEYWORDS).flatMap(([categoryId, keywords]) =>
  keywords.map((keyword) => ({ keyword, categoryId })),
);

/**
 * Picks a category from the first matching rule; falls back to a generic
 * income/expense bucket based on the sign of the amount.
 */
export function categorise(description: string, amount: number, rules: Rule[]): string {
  const haystack = description.toLowerCase();
  const match = rules.find((rule) => haystack.includes(rule.keyword.toLowerCase()));
  if (match) return match.categoryId;
  return amount > 0 ? INCOME_OTHER_ID : UNCATEGORISED_ID;
}
