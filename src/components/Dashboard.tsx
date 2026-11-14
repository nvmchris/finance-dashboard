import { formatMoney, formatMonth, formatPercent } from '../lib/format';
import {
  addMonths,
  balanceSeries,
  cashFlow,
  inMonth,
  monthOf,
  monthsEndingAt,
  relativeChange,
  spendingByCategory,
  summarise,
} from '../lib/stats';
import type { MonthKey } from '../lib/types';
import { useCategoryName, useStore } from '../state/store';
import { BalanceChart } from './charts/BalanceChart';
import { CashFlowChart } from './charts/CashFlowChart';
import { CategoryBars } from './charts/CategoryBars';
import { StatTile } from './StatTile';

const TREND_MONTHS = 6;

export function Dashboard({ month }: { month: MonthKey }) {
  const { transactions, settings } = useStore().data;
  const categoryName = useCategoryName();
  const { currency } = settings;

  const previousMonth = addMonths(month, -1);
  const current = summarise(inMonth(transactions, month));
  const previous = summarise(inMonth(transactions, previousMonth));
  const comparedTo = formatMonth(previousMonth, undefined, 'short');

  const trendMonths = monthsEndingAt(month, TREND_MONTHS);
  const balance = balanceSeries(transactions.filter((t) => monthOf(t.date) <= month)).filter(
    (point) => monthOf(point.date) >= trendMonths[0],
  );

  return (
    <div className="dashboard">
      <section className="tiles" aria-label={`Summary for ${formatMonth(month)}`}>
        <StatTile
          label="Income"
          value={formatMoney(current.income, currency)}
          delta={relativeChange(current.income, previous.income)}
          goodWhen="up"
          comparedTo={comparedTo}
        />
        <StatTile
          label="Expenses"
          value={formatMoney(current.expenses, currency)}
          delta={relativeChange(current.expenses, previous.expenses)}
          goodWhen="down"
          comparedTo={comparedTo}
        />
        <StatTile
          label="Net"
          value={formatMoney(current.net, currency)}
          delta={relativeChange(current.net, previous.net)}
          goodWhen="up"
          comparedTo={comparedTo}
        />
        <StatTile
          label="Savings rate"
          value={current.savingsRate === null ? '–' : formatPercent(current.savingsRate)}
          delta={
            current.savingsRate === null || previous.savingsRate === null
              ? null
              : relativeChange(current.savingsRate, previous.savingsRate)
          }
          goodWhen="up"
          comparedTo={comparedTo}
        />
      </section>

      <section className="card">
        <h2>Cash flow</h2>
        <p className="card__subtitle">Income and expenses, last {TREND_MONTHS} months</p>
        <CashFlowChart points={cashFlow(transactions, trendMonths)} currency={currency} />
      </section>

      <section className="card">
        <h2>Spending by category</h2>
        <p className="card__subtitle">{formatMonth(month)}</p>
        <CategoryBars
          totals={spendingByCategory(inMonth(transactions, month))}
          currency={currency}
          categoryName={categoryName}
        />
      </section>

      <section className="card card--wide">
        <h2>Balance</h2>
        <p className="card__subtitle">Running total of all imported transactions</p>
        <BalanceChart points={balance} months={trendMonths} currency={currency} />
      </section>
    </div>
  );
}
