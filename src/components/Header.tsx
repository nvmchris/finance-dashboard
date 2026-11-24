import type { ReactNode } from 'react';
import type { Theme } from '../lib/types';

export interface ViewTab<Id extends string> {
  id: Id;
  label: string;
}

interface HeaderProps<Id extends string> {
  views: ViewTab<Id>[];
  view: Id;
  onView: (view: Id) => void;
  theme: Theme;
  onToggleTheme: () => void;
  /** Controls shown on the right: month picker, import button. */
  children?: ReactNode;
}

export function Header<Id extends string>({
  views,
  view,
  onView,
  theme,
  onToggleTheme,
  children,
}: HeaderProps<Id>) {
  return (
    <header className="header">
      <div className="brand">
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="var(--accent)" />
          <path
            d="M8 22l5-6 4 3 7-9"
            fill="none"
            stroke="var(--on-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1>Saldo</h1>
      </div>
      <nav aria-label="Views">
        {views.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="tab"
            aria-current={tab.id === view ? 'page' : undefined}
            onClick={() => onView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="header__actions">
        {children}
        <button
          type="button"
          className="icon-button"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  );
}
