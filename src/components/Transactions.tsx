import { useState } from 'react';
import { exportCsv } from '../lib/csv';
import { download } from '../lib/download';
import { filterTransactions, NO_FILTER, sortTransactions } from '../lib/filter';
import type { KindFilter, Sort, SortKey, TransactionFilter } from '../lib/filter';
import { formatDate, formatMoney, formatMonth } from '../lib/format';
import { inMonth } from '../lib/stats';
import type { MonthKey } from '../lib/types';
import { useCategoryName, useStore } from '../state/store';
import { AddTransaction } from './AddTransaction';

const PAGE_SIZE = 50;

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', numeric: true },
];

export function Transactions({ month }: { month: MonthKey }) {
  const { data, dispatch } = useStore();
  const categoryName = useCategoryName();
  const { currency } = data.settings;

  const [filter, setFilter] = useState<TransactionFilter>(NO_FILTER);
  const [allTime, setAllTime] = useState(false);
  const [sort, setSort] = useState<Sort>({ key: 'date', descending: true });
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [adding, setAdding] = useState(false);

  const scoped = allTime ? data.transactions : inMonth(data.transactions, month);
  const rows = sortTransactions(filterTransactions(scoped, filter), sort);
  const total = rows.reduce((sum, t) => sum + t.amount, 0);
  const visible = rows.slice(0, limit);

  const patch = (change: Partial<TransactionFilter>) => {
    setFilter({ ...filter, ...change });
    setLimit(PAGE_SIZE);
  };
  const toggleSort = (key: SortKey) =>
    setSort({ key, descending: sort.key === key ? !sort.descending : key !== 'description' });

  return (
    <section className="card transactions">
      <div className="toolbar">
        <input
          type="search"
          className="toolbar__search"
          placeholder="Search descriptions…"
          aria-label="Search transactions"
          value={filter.query}
          onChange={(e) => patch({ query: e.target.value })}
        />
        <select
          aria-label="Category filter"
          value={filter.categoryId}
          onChange={(e) => patch({ categoryId: e.target.value })}
        >
          <option value="">All categories</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Type filter"
          value={filter.kind}
          onChange={(e) => patch({ kind: e.target.value as KindFilter })}
        >
          <option value="all">Income &amp; expenses</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>
        <label className="toolbar__check">
          <input type="checkbox" checked={allTime} onChange={(e) => setAllTime(e.target.checked)} />
          All months
        </label>
        <span className="toolbar__spacer" />
        <button
          type="button"
          className="button"
          disabled={rows.length === 0}
          onClick={() =>
            download('saldo-transactions.csv', exportCsv(rows, categoryName), 'text/csv')
          }
        >
          Export CSV
        </button>
        <button type="button" className="button button--primary" onClick={() => setAdding(true)}>
          Add transaction
        </button>
      </div>

      {adding && <AddTransaction onDone={() => setAdding(false)} />}

      <p className="transactions__summary" role="status">
        {rows.length} {rows.length === 1 ? 'transaction' : 'transactions'}
        {allTime ? '' : ` in ${formatMonth(month)}`} · total{' '}
        <strong>{formatMoney(total, currency)}</strong>
      </p>

      {rows.length === 0 ? (
        <p className="empty-hint">No transactions match these filters.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={column.numeric ? 'is-numeric' : undefined}
                    aria-sort={
                      sort.key !== column.key
                        ? 'none'
                        : sort.descending
                          ? 'descending'
                          : 'ascending'
                    }
                  >
                    <button type="button" onClick={() => toggleSort(column.key)}>
                      {column.label}
                      <span aria-hidden="true">
                        {sort.key !== column.key ? '' : sort.descending ? ' ↓' : ' ↑'}
                      </span>
                    </button>
                  </th>
                ))}
                <th>Category</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id}>
                  <td className="table__date">{formatDate(t.date)}</td>
                  <td>{t.description}</td>
                  <td className={t.amount > 0 ? 'is-numeric is-income' : 'is-numeric'}>
                    {t.amount > 0 ? '+' : ''}
                    {formatMoney(t.amount, currency)}
                  </td>
                  <td>
                    <select
                      className="table__category"
                      aria-label={`Category for ${t.description}`}
                      value={t.categoryId}
                      onChange={(e) =>
                        dispatch({
                          type: 'updateTransaction',
                          id: t.id,
                          patch: { categoryId: e.target.value },
                        })
                      }
                    >
                      {data.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="table__actions">
                    <button
                      type="button"
                      className="icon-button icon-button--quiet"
                      aria-label={`Delete ${t.description}`}
                      onClick={() => dispatch({ type: 'deleteTransaction', id: t.id })}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > limit && (
        <button
          type="button"
          className="button show-more"
          onClick={() => setLimit(limit + PAGE_SIZE)}
        >
          Show {Math.min(PAGE_SIZE, rows.length - limit)} more
        </button>
      )}
    </section>
  );
}
