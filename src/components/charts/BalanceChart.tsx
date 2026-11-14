import { useState } from 'react';
import type { PointerEvent } from 'react';
import { formatDate, formatMoney, formatMoneyShort, formatMonth } from '../../lib/format';
import type { BalancePoint } from '../../lib/stats';
import { addMonths } from '../../lib/stats';
import type { MonthKey } from '../../lib/types';
import { useWidth } from '../../hooks/useWidth';
import { clamp, niceScale } from './scale';
import { Tooltip, TooltipRow } from './Tooltip';

const HEIGHT = 240;
const MARGIN = { top: 12, right: 12, bottom: 28, left: 52 };
const TICK_COUNT = 4;
const FALLBACK_WIDTH = 640;
const TOOLTIP_EDGE = 80;
const MARKER_RADIUS = 4;

function monthStart(month: MonthKey): number {
  return Date.parse(`${month}-01T00:00:00Z`);
}

interface BalanceChartProps {
  points: BalancePoint[];
  /** Months shown on the x-axis, oldest first. */
  months: MonthKey[];
  currency: string;
}

export function BalanceChart({ points, months, currency }: BalanceChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const [active, setActive] = useState<number | null>(null);

  if (points.length === 0) return <p className="empty-hint">No transactions in this period.</p>;

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const start = monthStart(months[0]);
  const end = monthStart(addMonths(months[months.length - 1], 1));
  const balances = points.map((p) => p.balance);
  const scale = niceScale(Math.min(0, ...balances), Math.max(0, ...balances), TICK_COUNT);

  const x = (time: number) => MARGIN.left + (innerWidth * (time - start)) / (end - start);
  const y = (value: number) =>
    MARGIN.top + innerHeight * (1 - (value - scale.min) / (scale.max - scale.min));
  const coords = points.map((p) => ({ x: x(Date.parse(`${p.date}T00:00:00Z`)), y: y(p.balance) }));
  // Step line: a balance holds until the next transaction, it does not drift between days.
  const line = coords
    .map((c, i) =>
      i === 0 ? `M${c.x.toFixed(1)},${c.y.toFixed(1)}` : `H${c.x.toFixed(1)} V${c.y.toFixed(1)}`,
    )
    .join(' ');

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const pointerX = event.clientX - event.currentTarget.getBoundingClientRect().left;
    let nearest = 0;
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(coords[i].x - pointerX) < Math.abs(coords[nearest].x - pointerX)) nearest = i;
    }
    setActive(nearest);
  };

  const activeCoord = active === null ? null : coords[active];
  const activePoint = active === null ? null : points[active];

  return (
    <div className="chart" ref={ref}>
      <svg
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label={`Account balance, ending at ${formatMoney(balances[balances.length - 1], currency)}`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
      >
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
        {months.map((month) => (
          <text
            key={month}
            className="tick"
            x={x(monthStart(month)) + innerWidth / months.length / 2}
            y={HEIGHT - MARGIN.bottom + 18}
            textAnchor="middle"
          >
            {formatMonth(month, undefined, 'short')}
          </text>
        ))}
        <path className="line" d={line} />
        {activeCoord && (
          <>
            <line
              className="crosshair"
              x1={activeCoord.x}
              x2={activeCoord.x}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
            />
            <circle className="marker" cx={activeCoord.x} cy={activeCoord.y} r={MARKER_RADIUS} />
          </>
        )}
      </svg>
      {activeCoord && activePoint && (
        <Tooltip
          x={clamp(activeCoord.x, TOOLTIP_EDGE, Math.max(TOOLTIP_EDGE, width - TOOLTIP_EDGE))}
          y={activeCoord.y}
        >
          <div className="chart-tooltip__title">{formatDate(activePoint.date)}</div>
          <TooltipRow label="Balance" value={formatMoney(activePoint.balance, currency)} />
        </Tooltip>
      )}
    </div>
  );
}
