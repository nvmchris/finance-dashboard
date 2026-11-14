import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { createSampleData } from './lib/sample';
import { emptyData } from './lib/storage';

const TODAY = new Date(2026, 5, 15);
const CSV =
  'Datum;Verwendungszweck;Betrag\n01.03.2026;Gehalt;3.000,00\n02.03.2026;REWE;-45,10\nx;y;z';

beforeEach(() => localStorage.clear());

test('starts empty and loads demo data', async () => {
  render(<App initial={emptyData()} />);
  expect(screen.getByRole('heading', { name: 'See where your money goes' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Load demo data' }));
  expect(screen.getByRole('heading', { name: 'Cash flow' })).toBeInTheDocument();
});

test('imports a CSV file and reports the result', async () => {
  render(<App initial={emptyData()} />);
  const file = new File([CSV], 'bank.csv', { type: 'text/csv' });
  await userEvent.upload(screen.getByLabelText('CSV file'), file);

  expect(await screen.findByRole('status')).toHaveTextContent(
    'Imported 2 transactions (1 unreadable row ignored).',
  );
  expect(screen.getByLabelText('Month')).toHaveValue('2026-03');
});

test('shows an error for files without the required columns', async () => {
  render(<App initial={emptyData()} />);
  const file = new File(['foo,bar\n1,2'], 'bad.csv', { type: 'text/csv' });
  await userEvent.upload(screen.getByLabelText('CSV file'), file);
  expect(await screen.findByRole('alert')).toHaveTextContent('No date column');
});

test('shows the summary of the selected month and navigates between months', async () => {
  render(<App initial={createSampleData(TODAY)} />);
  const summary = screen.getByRole('region', { name: /Summary for June 2026/ });
  expect(within(summary).getByText('Income')).toBeInTheDocument();
  expect(within(summary).getByText('Savings rate')).toBeInTheDocument();

  expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
  expect(screen.getByRole('region', { name: /Summary for May 2026/ })).toBeInTheDocument();
});

test('toggles and remembers the theme', async () => {
  render(<App initial={emptyData()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
});
