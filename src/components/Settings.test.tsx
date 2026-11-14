import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { createSampleData } from '../lib/sample';
import { emptyData } from '../lib/storage';
import type { AppData } from '../lib/types';

const DATA: AppData = {
  ...emptyData(),
  transactions: [
    {
      id: '1',
      date: '2026-03-02',
      description: 'Bäckerei Huber',
      amount: -450,
      categoryId: 'uncategorised',
    },
  ],
};

async function openSettings(data = DATA) {
  render(<App initial={data} />);
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

test('changes the display currency', async () => {
  await openSettings();
  await userEvent.selectOptions(screen.getByLabelText('Currency'), 'USD');
  await userEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
  expect(screen.getAllByText('$4.50').length).toBeGreaterThan(0);
});

test('adds a rule, applies it and removes it', async () => {
  await openSettings();
  await userEvent.type(screen.getByLabelText('Keyword'), 'bäckerei');
  await userEvent.selectOptions(screen.getByLabelText('Rule category'), 'dining');
  await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));

  const rules = screen.getByRole('list', { name: 'Rules' });
  expect(within(rules).getAllByRole('listitem')[0]).toHaveTextContent('bäckerei→Dining out');

  await userEvent.click(screen.getByRole('button', { name: 'Apply to uncategorised' }));
  await userEvent.click(screen.getByRole('button', { name: 'Transactions' }));
  expect(screen.getByLabelText('Category for Bäckerei Huber')).toHaveValue('dining');

  await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
  await userEvent.click(screen.getByRole('button', { name: 'Remove rule bäckerei' }));
  expect(screen.queryByText('bäckerei')).not.toBeInTheDocument();
});

test('restores a backup and rejects other files', async () => {
  await openSettings(emptyData());
  const backup = JSON.stringify(createSampleData(new Date(2026, 5, 15)));
  await userEvent.upload(screen.getByLabelText('Backup file'), new File([backup], 'backup.json'));
  expect(await screen.findByRole('status')).toHaveTextContent('Backup restored.');
  expect(screen.getByLabelText('Month')).toHaveValue('2026-06');

  await userEvent.upload(screen.getByLabelText('Backup file'), new File(['[]'], 'other.json'));
  expect(await screen.findByRole('alert')).toHaveTextContent('not a Saldo backup');
});

test('deletes all data only after confirmation', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await openSettings();
  await userEvent.click(screen.getByRole('button', { name: 'Delete all data' }));
  expect(screen.getByLabelText('Month')).toBeInTheDocument();

  confirm.mockReturnValue(true);
  await userEvent.click(screen.getByRole('button', { name: 'Delete all data' }));
  expect(screen.queryByLabelText('Month')).not.toBeInTheDocument();
});
