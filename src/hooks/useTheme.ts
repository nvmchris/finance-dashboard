import { useEffect } from 'react';
import type { Theme } from '../lib/types';

function systemTheme(): Theme {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

/** Resolves the stored preference (or the OS setting) and applies it to the document. */
export function useTheme(preference: Theme | null): Theme {
  const theme = preference ?? systemTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return theme;
}
