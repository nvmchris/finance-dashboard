import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Notice } from '../hooks/useNotice';
import { download } from '../lib/download';
import { toIsoDate } from '../lib/format';
import { emptyData, parseData } from '../lib/storage';
import { useCategoryName, useStore } from '../state/store';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'PLN', 'CZK', 'JPY'];

export function Settings({ onNotice }: { onNotice: (notice: Notice) => void }) {
  const { data, dispatch } = useStore();
  const categoryName = useCategoryName();
  const restoreInput = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState(data.categories[0].id);

  const onAddRule = (event: FormEvent) => {
    event.preventDefault();
    if (!keyword.trim()) return;
    dispatch({ type: 'addRule', rule: { keyword, categoryId } });
    setKeyword('');
  };

  const onRestore = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      dispatch({ type: 'replace', data: parseData(await file.text()) });
      onNotice({ kind: 'info', text: 'Backup restored.' });
    } catch (error) {
      onNotice({ kind: 'error', text: error instanceof Error ? error.message : String(error) });
    }
  };

  const onReset = () => {
    if (!window.confirm('Delete all transactions, budgets and rules? This cannot be undone.'))
      return;
    dispatch({ type: 'replace', data: emptyData() });
    onNotice({ kind: 'info', text: 'All data deleted.' });
  };

  return (
    <div className="settings">
      <section className="card">
        <h2>General</h2>
        <label className="field">
          Currency
          <select
            value={data.settings.currency}
            onChange={(e) => dispatch({ type: 'setCurrency', currency: e.target.value })}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
        <p className="card__subtitle">
          Changes how amounts are displayed. Amounts are not converted.
        </p>
      </section>

      <section className="card">
        <div className="card__head">
          <h2>Category rules</h2>
          <button type="button" className="link" onClick={() => dispatch({ type: 'applyRules' })}>
            Apply to uncategorised
          </button>
        </div>
        <p className="card__subtitle">
          A transaction whose description contains the keyword gets the category. The first match
          wins; your newest rules come first.
        </p>
        <form className="rule-form" onSubmit={onAddRule} aria-label="Add rule">
          <input
            type="text"
            placeholder="Keyword, e.g. bakery"
            aria-label="Keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            aria-label="Rule category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="button button--primary">
            Add rule
          </button>
        </form>
        <ul className="rules" aria-label="Rules">
          {data.rules.map((rule) => (
            <li key={rule.keyword}>
              <span className="rules__keyword">{rule.keyword}</span>
              <span className="rules__arrow" aria-hidden="true">
                →
              </span>
              <span>{categoryName(rule.categoryId)}</span>
              <button
                type="button"
                className="icon-button icon-button--quiet"
                aria-label={`Remove rule ${rule.keyword}`}
                onClick={() => dispatch({ type: 'removeRule', keyword: rule.keyword })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Your data</h2>
        <p className="card__subtitle">
          Everything is stored in this browser only. Keep a backup if it matters to you.
        </p>
        <div className="settings__actions">
          <button
            type="button"
            className="button"
            onClick={() =>
              download(
                `saldo-backup-${toIsoDate(new Date())}.json`,
                JSON.stringify(data, null, 2),
                'application/json',
              )
            }
          >
            Download backup
          </button>
          <button type="button" className="button" onClick={() => restoreInput.current?.click()}>
            Restore backup
          </button>
          <input
            ref={restoreInput}
            type="file"
            accept=".json,application/json"
            aria-label="Backup file"
            hidden
            onChange={onRestore}
          />
          <button type="button" className="button button--danger" onClick={onReset}>
            Delete all data
          </button>
        </div>
      </section>
    </div>
  );
}
