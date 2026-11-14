import { useState } from 'react';
import type { FormEvent } from 'react';
import { categorise } from '../lib/categories';
import { parseAmount } from '../lib/csv';
import { toIsoDate } from '../lib/format';
import type { Transaction } from '../lib/types';
import { useStore } from '../state/store';

type Kind = 'expense' | 'income';

/** Inline form for transactions that never appear in a bank export (cash, corrections). */
export function AddTransaction({ onDone }: { onDone: () => void }) {
  const { data, dispatch } = useStore();
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<Kind>('expense');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cents = parseAmount(amount);
    if (cents === null || cents === 0) return setError('Enter an amount, for example 12.50.');
    if (!description.trim()) return setError('Enter a description.');

    const signed = kind === 'expense' ? -Math.abs(cents) : Math.abs(cents);
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      description: description.trim(),
      amount: signed,
      categoryId: categorise(description, signed, data.rules),
    };
    dispatch({ type: 'import', transactions: [transaction] });
    onDone();
  };

  return (
    <form className="add-form" onSubmit={onSubmit} aria-label="Add transaction">
      <label>
        Date
        <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="add-form__grow">
        Description
        <input
          type="text"
          value={description}
          placeholder="Farmers market"
          autoFocus
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label>
        Type
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>
      <label>
        Amount
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          placeholder="0.00"
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <button type="submit" className="button button--primary">
        Add
      </button>
      <button type="button" className="button" onClick={onDone}>
        Cancel
      </button>
      {error && (
        <p className="add-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
