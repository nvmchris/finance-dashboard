import type { Transaction } from './types';

export type KindFilter = 'all' | 'income' | 'expense';

export interface TransactionFilter {
  query: string;
  /** Empty string matches every category. */
  categoryId: string;
  kind: KindFilter;
}

export const NO_FILTER: TransactionFilter = { query: '', categoryId: '', kind: 'all' };

export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter,
): Transaction[] {
  const query = filter.query.trim().toLowerCase();
  return transactions.filter((t) => {
    if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
    if (filter.kind === 'income' && t.amount <= 0) return false;
    if (filter.kind === 'expense' && t.amount >= 0) return false;
    return !query || t.description.toLowerCase().includes(query);
  });
}

export type SortKey = 'date' | 'description' | 'amount';

export interface Sort {
  key: SortKey;
  descending: boolean;
}

export function sortTransactions(transactions: Transaction[], sort: Sort): Transaction[] {
  const direction = sort.descending ? -1 : 1;
  return [...transactions].sort((a, b) => {
    const order =
      sort.key === 'amount' ? a.amount - b.amount : a[sort.key].localeCompare(b[sort.key]);
    return order * direction;
  });
}
