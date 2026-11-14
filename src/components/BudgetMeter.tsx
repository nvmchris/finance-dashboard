import type { BudgetProgress, BudgetStatus } from '../lib/budgets';
import { formatMoney, formatPercent } from '../lib/format';

const STATUS: Record<BudgetStatus, { icon: string; label: string }> = {
  ok: { icon: '✓', label: 'On track' },
  warning: { icon: '!', label: 'Close to limit' },
  over: { icon: '✕', label: 'Over budget' },
};

interface BudgetMeterProps {
  progress: BudgetProgress;
  name: string;
  currency: string;
}

/** A labelled meter; state is carried by icon and text, not by colour alone. */
export function BudgetMeter({ progress, name, currency }: BudgetMeterProps) {
  const { spent, limit, remaining, ratio, status } = progress;
  const { icon, label } = STATUS[status];
  const detail =
    remaining >= 0
      ? `${formatMoney(remaining, currency)} left`
      : `${formatMoney(-remaining, currency)} over`;

  return (
    <div className={`meter meter--${status}`}>
      <div className="meter__head">
        <span className="meter__name">{name}</span>
        <span className="meter__amounts">
          {formatMoney(spent, currency)} of {formatMoney(limit, currency)}
        </span>
      </div>
      <div
        className="meter__track"
        role="meter"
        aria-label={`${name} budget`}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(spent, limit)}
        aria-valuetext={`${formatPercent(ratio)} used, ${detail}`}
      >
        <div className="meter__fill" style={{ width: `${Math.min(1, ratio) * 100}%` }} />
      </div>
      <p className="meter__status">
        <span className="meter__icon" aria-hidden="true">
          {icon}
        </span>
        {label} · {detail}
      </p>
    </div>
  );
}
