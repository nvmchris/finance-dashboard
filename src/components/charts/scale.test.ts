import { barPath, clamp, niceScale } from './scale';

describe('niceScale', () => {
  it('rounds the domain outward to nice steps', () => {
    expect(niceScale(0, 324000, 4)).toEqual({
      min: 0,
      max: 400000,
      ticks: [0, 100000, 200000, 300000, 400000],
    });
  });

  it('covers negative values', () => {
    const scale = niceScale(-1200, 3300, 4);
    expect(scale.min).toBeLessThanOrEqual(-1200);
    expect(scale.max).toBeGreaterThanOrEqual(3300);
    expect(scale.ticks).toContain(0);
  });

  it('survives an empty range', () => {
    expect(niceScale(0, 0, 4).max).toBeGreaterThanOrEqual(0);
  });
});

test('barPath shrinks the radius for tiny bars', () => {
  expect(barPath(0, 9, 10, 1, 4)).toContain('Q0,9 1,9');
});

test('clamp limits a value to a range', () => {
  expect(clamp(15, 0, 10)).toBe(10);
  expect(clamp(-1, 0, 10)).toBe(0);
});
