import { useState } from 'react';
import type { FormEvent } from 'react';
import { budgetProgress, budgetTotals } from '../lib/budgets';
import { parseAmount } from '../lib/csv';
import { formatMoney, formatMonth } from '../lib/format';
import { inMonth } from '../lib/stats';
import type { MonthKey } from '../lib/types';
import { useCategoryName, useStore } from '../state/store';
import { BudgetMeter } from './BudgetMeter';

const CENTS_PER_UNIT = 100;

export function Budgets({ month }: { month: MonthKey }) {
  const { data, dispatch } = useStore();
  const categoryName = useCategoryName();
  const { currency } = data.settings;

  const progress = budgetProgress(data.budgets, inMonth(data.transactions, month));
  const totals = budgetTotals(progress);
  const available = data.categories.filter(
    (c) => c.kind === 'expense' && !data.budgets.some((b) => b.categoryId === c.id),
  );

  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selected = available.some((c) => c.id === categoryId) ? categoryId : available[0]?.id;

  const onAdd = (event: FormEvent) => {
    event.preventDefault();
    const cents = parseAmount(limit);
    if (!selected || cents === null || cents <= 0) {
      return setError('Enter a monthly limit greater than zero.');
    }
    dispatch({ type: 'setBudget', categoryId: selected, limit: cents });
    setLimit('');
    setError(null);
  };

  const onEdit = (id: string, value: string) => {
    const cents = parseAmount(value);
    if (cents !== null && cents > 0) dispatch({ type: 'setBudget', categoryId: id, limit: cents });
  };

  return (
    <div className="budgets">
      <section className="card">
        <h2>Budgets</h2>
        <p className="card__subtitle">{formatMonth(month)}</p>

        {progress.length === 0 ? (
          <p className="empty-hint">No budgets yet. Add one below to keep a category in check.</p>
        ) : (
          <>
            <p className="budgets__totals" role="status">
              <strong>{formatMoney(totals.spent, currency)}</strong> spent of{' '}
              <strong>{formatMoney(totals.limit, currency)}</strong> budgeted ·{' '}
              {totals.remaining >= 0
                ? `${formatMoney(totals.remaining, currency)} left`
                : `${formatMoney(-totals.remaining, currency)} over`}
            </p>
            <ul className="budgets__list">
              {progress.map((p) => (
                <li key={p.categoryId}>
                  <BudgetMeter progress={p} name={categoryName(p.categoryId)} currency={currency} />
                  <div className="budgets__edit">
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`Monthly limit for ${categoryName(p.categoryId)}`}
                      // Remount when the stored limit changes so the field shows the saved value.
                      key={p.limit}
                      defaultValue={(p.limit / CENTS_PER_UNIT).toFixed(2)}
                      onBlur={(e) => onEdit(p.categoryId, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    />
                    <button
                      type="button"
                      className="icon-button icon-button--quiet"
                      aria-label={`Remove budget for ${categoryName(p.categoryId)}`}
                      onClick={() =>
                        dispatch({ type: 'setBudget', categoryId: p.categoryId, limit: 0 })
                      }
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {available.length > 0 && (
        <form className="card add-budget" onSubmit={onAdd} aria-label="Add budget">
          <h2>Add a budget</h2>
          <div className="add-budget__fields">
            <label>
              Category
              <select value={selected} onChange={(e) => setCategoryId(e.target.value)}>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Monthly limit
              <input
                type="text"
                inputMode="decimal"
                placeholder="250.00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </label>
            <button type="submit" className="button button--primary">
              Add budget
            </button>
          </div>
          {error && (
            <p className="add-form__error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
