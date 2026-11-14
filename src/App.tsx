import { useState } from 'react';
import { Budgets } from './components/Budgets';
import { Dashboard } from './components/Dashboard';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import type { ViewTab } from './components/Header';
import { ImportButton } from './components/ImportButton';
import { MonthPicker } from './components/MonthPicker';
import { Settings } from './components/Settings';
import { Transactions } from './components/Transactions';
import { useNotice } from './hooks/useNotice';
import { useTheme } from './hooks/useTheme';
import { importCsv } from './lib/csv';
import { createSampleData } from './lib/sample';
import { listMonths } from './lib/stats';
import type { AppData, MonthKey } from './lib/types';
import { StoreProvider, useStore } from './state/store';

type View = 'dashboard' | 'transactions' | 'budgets' | 'settings';

const VIEWS: ViewTab<View>[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'settings', label: 'Settings' },
];

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function Shell() {
  const { data, dispatch } = useStore();
  const [view, setView] = useState<View>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<MonthKey | null>(null);
  const [notice, setNotice] = useNotice();
  const theme = useTheme(data.settings.theme);

  const months = listMonths(data.transactions);
  const month = selectedMonth && months.includes(selectedMonth) ? selectedMonth : months[0];

  const onFile = (text: string) => {
    try {
      const result = importCsv(text, data.rules, data.transactions);
      dispatch({ type: 'import', transactions: result.transactions });
      const details = [
        result.duplicates > 0 && `${plural(result.duplicates, 'duplicate')} skipped`,
        result.invalid > 0 && `${plural(result.invalid, 'unreadable row')} ignored`,
      ].filter(Boolean);
      const suffix = details.length > 0 ? ` (${details.join(', ')})` : '';
      setNotice({
        kind: 'info',
        text: `Imported ${plural(result.transactions.length, 'transaction')}${suffix}.`,
      });
      if (result.transactions.length > 0) setSelectedMonth(null);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="app">
      <Header
        views={VIEWS}
        view={view}
        onView={setView}
        theme={theme}
        onToggleTheme={() =>
          dispatch({ type: 'setTheme', theme: theme === 'dark' ? 'light' : 'dark' })
        }
      >
        {month && <MonthPicker month={month} months={months} onChange={setSelectedMonth} />}
        {month && <ImportButton onFile={onFile} />}
      </Header>
      <main>
        {month && view === 'dashboard' && (
          <Dashboard month={month} onShowBudgets={() => setView('budgets')} />
        )}
        {month && view === 'transactions' && <Transactions month={month} />}
        {month && view === 'budgets' && <Budgets month={month} />}
        {view === 'settings' && <Settings onNotice={setNotice} />}
        {!month && view !== 'settings' && (
          <EmptyState
            onFile={onFile}
            onDemo={() => dispatch({ type: 'replace', data: createSampleData() })}
          />
        )}
      </main>
      {notice && (
        <p
          className={`notice notice--${notice.kind}`}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}

interface AppProps {
  initial?: AppData;
  persist?: boolean;
}

export function App({ initial, persist }: AppProps) {
  return (
    <StoreProvider initial={initial} persist={persist}>
      <Shell />
    </StoreProvider>
  );
}
