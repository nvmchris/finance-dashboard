const NICE_STEPS = [1, 2, 2.5, 5, 10];

export interface Scale {
  min: number;
  max: number;
  ticks: number[];
}

/** Rounds a domain outward to "nice" tick values (1, 2, 2.5, 5 × 10ⁿ). */
export function niceScale(min: number, max: number, targetTicks: number): Scale {
  const range = max - min || 1;
  const rough = range / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = magnitude * (NICE_STEPS.find((s) => s * magnitude >= rough) ?? 10);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const count = Math.round((niceMax - niceMin) / step);
  const ticks = Array.from({ length: count + 1 }, (_, i) => niceMin + i * step);
  return { min: niceMin, max: niceMax, ticks };
}

/** SVG path for a bar with only its top (data) end rounded, anchored to the baseline. */
export function barPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.max(0, Math.min(radius, height, width / 2));
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${y + height}`,
    'Z',
  ].join(' ');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
