import { toIsoDate } from './format';
import { emptyData } from './storage';
import type { AppData, Budget, Transaction } from './types';

const SAMPLE_MONTHS = 6;
const SEED = 20260101;

/** Small deterministic PRNG (mulberry32) so demo data is stable across runs. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Fixed {
  day: number;
  description: string;
  amount: number;
  categoryId: string;
}

const FIXED: Fixed[] = [
  { day: 1, description: 'Salary ACME GmbH', amount: 324000, categoryId: 'salary' },
  { day: 2, description: 'Rent Hausverwaltung Maier', amount: -98000, categoryId: 'housing' },
  { day: 5, description: 'Electricity Wien Energie', amount: -6400, categoryId: 'utilities' },
  { day: 6, description: 'Internet A1 Telekom', amount: -3490, categoryId: 'utilities' },
  { day: 10, description: 'Netflix', amount: -1399, categoryId: 'subscriptions' },
  { day: 12, description: 'Spotify', amount: -1099, categoryId: 'subscriptions' },
  { day: 15, description: 'Gym FitInn', amount: -2990, categoryId: 'health' },
];

interface Variable {
  descriptions: string[];
  categoryId: string;
  perMonth: [min: number, max: number];
  amount: [min: number, max: number];
}

const VARIABLE: Variable[] = [
  {
    descriptions: ['Billa', 'Spar', 'Hofer', 'Lidl'],
    categoryId: 'groceries',
    perMonth: [7, 10],
    amount: [1200, 6800],
  },
  {
    descriptions: ['Pizzeria Napoli', 'Cafe Central', 'Burger Brothers', 'Lieferando'],
    categoryId: 'dining',
    perMonth: [3, 6],
    amount: [900, 4200],
  },
  {
    descriptions: ['ÖBB Ticket', 'OMV Tankstelle', 'Uber'],
    categoryId: 'transport',
    perMonth: [2, 5],
    amount: [800, 6500],
  },
  {
    descriptions: ['Amazon', 'Zalando', 'IKEA', 'MediaMarkt'],
    categoryId: 'shopping',
    perMonth: [1, 3],
    amount: [1500, 14000],
  },
  {
    descriptions: ['Kino Cineplexx', 'Steam', 'Concert Ticket', 'Museum'],
    categoryId: 'leisure',
    perMonth: [1, 3],
    amount: [900, 6000],
  },
];

const SAMPLE_BUDGETS: Budget[] = [
  { categoryId: 'groceries', limit: 40000 },
  { categoryId: 'dining', limit: 12000 },
  { categoryId: 'transport', limit: 15000 },
  { categoryId: 'shopping', limit: 15000 },
  { categoryId: 'leisure', limit: 10000 },
];

const MAX_SAFE_DAY = 28;

/** Demo data covering the last six months up to `today`. */
export function createSampleData(today: Date = new Date()): AppData {
  const random = createRandom(SEED);
  const between = (min: number, max: number) => Math.floor(min + random() * (max - min + 1));
  const transactions: Transaction[] = [];
  const add = (date: Date, description: string, amount: number, categoryId: string) => {
    if (date > today) return;
    transactions.push({
      id: `sample-${transactions.length}`,
      date: toIsoDate(date),
      description,
      amount,
      categoryId,
    });
  };

  for (let offset = SAMPLE_MONTHS - 1; offset >= 0; offset--) {
    const year = today.getFullYear();
    const month = today.getMonth() - offset;
    for (const fixed of FIXED) {
      add(new Date(year, month, fixed.day), fixed.description, fixed.amount, fixed.categoryId);
    }
    for (const group of VARIABLE) {
      const count = between(...group.perMonth);
      for (let i = 0; i < count; i++) {
        const description = group.descriptions[between(0, group.descriptions.length - 1)];
        const date = new Date(year, month, between(1, MAX_SAFE_DAY));
        add(date, description, -between(...group.amount), group.categoryId);
      }
    }
  }

  transactions.sort((a, b) => a.date.localeCompare(b.date));
  return { ...emptyData(), transactions, budgets: SAMPLE_BUDGETS };
}
