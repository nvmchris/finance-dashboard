import { formatMoney, formatPercent } from '../../lib/format';
import type { CategoryTotal } from '../../lib/stats';

interface CategoryBarsProps {
  totals: CategoryTotal[];
  currency: string;
  categoryName: (id: string) => string;
}

/**
 * Ranked horizontal bars: one hue, every row directly labelled. A pie would
 * need a colour per category, which stops being readable past a handful.
 */
export function CategoryBars({ totals, currency, categoryName }: CategoryBarsProps) {
  if (totals.length === 0) return <p className="empty-hint">No spending this month.</p>;

  const sum = totals.reduce((acc, t) => acc + t.total, 0);
  const largest = totals[0].total;

  return (
    <ol className="category-bars">
      {totals.map(({ categoryId, total }) => (
        <li key={categoryId}>
          <span className="category-bars__name">{categoryName(categoryId)}</span>
          <span className="category-bars__track">
            <span
              className="category-bars__fill"
              style={{ width: `${(total / largest) * 100}%` }}
            />
          </span>
          <span className="category-bars__value">{formatMoney(total, currency)}</span>
          <span className="category-bars__share">{formatPercent(total / sum)}</span>
        </li>
      ))}
    </ol>
  );
}
