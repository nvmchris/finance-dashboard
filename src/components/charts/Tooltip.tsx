import type { ReactNode } from 'react';

interface TooltipProps {
  /** Anchor point in pixels, relative to the chart container. */
  x: number;
  y: number;
  children: ReactNode;
}

export function Tooltip({ x, y, children }: TooltipProps) {
  return (
    <div className="chart-tooltip" style={{ left: x, top: y }} role="status">
      {children}
    </div>
  );
}

export function TooltipRow({
  swatch,
  label,
  value,
}: {
  swatch?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="chart-tooltip__row">
      {swatch && <span className="swatch" style={{ background: swatch }} />}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
