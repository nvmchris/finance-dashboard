import { formatPercent } from '../lib/format';

interface StatTileProps {
  label: string;
  value: string;
  /** Relative change against the comparison period; `null` hides the delta. */
  delta: number | null;
  /** Whether a rising value is good news (income) or bad news (expenses). */
  goodWhen: 'up' | 'down';
  comparedTo: string;
}

export function StatTile({ label, value, delta, goodWhen, comparedTo }: StatTileProps) {
  const rising = delta !== null && delta > 0;
  const flat = delta === null || delta === 0;
  const good = rising === (goodWhen === 'up');

  return (
    <article className="tile">
      <h3 className="tile__label">{label}</h3>
      <p className="tile__value">{value}</p>
      <p className={flat ? 'tile__delta' : `tile__delta ${good ? 'is-good' : 'is-bad'}`}>
        {delta === null ? (
          <span>No data for {comparedTo}</span>
        ) : (
          <>
            <span aria-hidden="true">{flat ? '→' : rising ? '▲' : '▼'}</span>{' '}
            <strong>{formatPercent(Math.abs(delta))}</strong>{' '}
            <span className="tile__context">
              {flat ? 'same as' : rising ? 'more than' : 'less than'} {comparedTo}
            </span>
          </>
        )}
      </p>
    </article>
  );
}
