import { useState } from 'react';
import { formatMoney, formatMoneyShort, formatMonth } from '../../lib/format';
import type { CashFlowPoint } from '../../lib/stats';
import { useWidth } from '../../hooks/useWidth';
import { barPath, clamp, niceScale } from './scale';
import { Tooltip, TooltipRow } from './Tooltip';

const HEIGHT = 240;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 52 };
const MAX_BAR_WIDTH = 24;
const BAR_GAP = 2;
const BAR_RADIUS = 4;
const TICK_COUNT = 4;
const FALLBACK_WIDTH = 640;
const TOOLTIP_EDGE = 90;

const SERIES = [
  { key: 'income', label: 'Income', color: 'var(--series-1)' },
  { key: 'expenses', label: 'Expenses', color: 'var(--series-2)' },
] as const;

interface CashFlowChartProps {
  points: CashFlowPoint[];
  currency: string;
}

export function CashFlowChart({ points, currency }: CashFlowChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const [active, setActive] = useState<number | null>(null);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const highest = Math.max(1, ...points.flatMap((p) => [p.income, p.expenses]));
  const scale = niceScale(0, highest, TICK_COUNT);
  const band = innerWidth / Math.max(1, points.length);
  const barWidth = clamp(band / 2 - 8, 2, MAX_BAR_WIDTH);
  const baseline = MARGIN.top + innerHeight;
  const y = (value: number) => MARGIN.top + innerHeight * (1 - value / scale.max);
  const centre = (index: number) => MARGIN.left + band * (index + 0.5);

  const activePoint = active === null ? null : points[active];

  return (
    <div className="chart" ref={ref}>
      <ul className="legend">
        {SERIES.map((series) => (
          <li key={series.key}>
            <span className="swatch" style={{ background: series.color }} />
            {series.label}
          </li>
        ))}
      </ul>
      <svg width="100%" height={HEIGHT} role="img" aria-label="Income and expenses per month">
        {scale.ticks.map((tick) => (
          <g key={tick}>
            <line
              className={tick === 0 ? 'axis-line' : 'grid-line'}
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text className="tick" x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
              {formatMoneyShort(tick, currency)}
            </text>
          </g>
        ))}
        {points.map((point, index) => (
          <g
            key={point.month}
            className={active !== null && active !== index ? 'bar-group is-dimmed' : 'bar-group'}
            tabIndex={0}
            aria-label={`${formatMonth(point.month)}: income ${formatMoney(point.income, currency)}, expenses ${formatMoney(point.expenses, currency)}`}
            onPointerEnter={() => setActive(index)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
          >
            {/* Hit target spans the whole band, not just the bars. */}
            <rect
              x={centre(index) - band / 2}
              y={MARGIN.top}
              width={band}
              height={innerHeight}
              fill="transparent"
            />
            {SERIES.map((series, seriesIndex) => {
              const value = point[series.key];
              const x = centre(index) + (seriesIndex === 0 ? -barWidth - BAR_GAP / 2 : BAR_GAP / 2);
              return (
                <path
                  key={series.key}
                  d={barPath(x, y(value), barWidth, baseline - y(value), BAR_RADIUS)}
                  fill={series.color}
                />
              );
            })}
            <text className="tick" x={centre(index)} y={baseline + 18} textAnchor="middle">
              {formatMonth(point.month, undefined, 'short')}
            </text>
          </g>
        ))}
      </svg>
      {activePoint && active !== null && (
        <Tooltip
          x={clamp(centre(active), TOOLTIP_EDGE, Math.max(TOOLTIP_EDGE, width - TOOLTIP_EDGE))}
          y={y(Math.max(activePoint.income, activePoint.expenses))}
        >
          <div className="chart-tooltip__title">{formatMonth(activePoint.month)}</div>
          {SERIES.map((series) => (
            <TooltipRow
              key={series.key}
              swatch={series.color}
              label={series.label}
              value={formatMoney(activePoint[series.key], currency)}
            />
          ))}
          <TooltipRow label="Net" value={formatMoney(activePoint.net, currency)} />
        </Tooltip>
      )}
      <table className="sr-only">
        <caption>Income and expenses per month</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.month}>
              <th>{formatMonth(point.month)}</th>
              <td>{formatMoney(point.income, currency)}</td>
              <td>{formatMoney(point.expenses, currency)}</td>
              <td>{formatMoney(point.net, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
