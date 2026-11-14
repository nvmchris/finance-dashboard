import { formatMonth } from '../lib/format';
import type { MonthKey } from '../lib/types';

interface MonthPickerProps {
  month: MonthKey;
  /** Months with data, newest first. */
  months: MonthKey[];
  onChange: (month: MonthKey) => void;
}

export function MonthPicker({ month, months, onChange }: MonthPickerProps) {
  const index = months.indexOf(month);
  const older = months[index + 1];
  const newer = index > 0 ? months[index - 1] : undefined;

  return (
    <div className="month-picker">
      <button
        type="button"
        className="icon-button"
        aria-label="Previous month"
        disabled={!older}
        onClick={() => older && onChange(older)}
      >
        ‹
      </button>
      <select aria-label="Month" value={month} onChange={(event) => onChange(event.target.value)}>
        {months.map((option) => (
          <option key={option} value={option}>
            {formatMonth(option)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="icon-button"
        aria-label="Next month"
        disabled={!newer}
        onClick={() => newer && onChange(newer)}
      >
        ›
      </button>
    </div>
  );
}
