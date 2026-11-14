import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { emptyData } from '../lib/storage';
import type { AppData } from '../lib/types';

const DATA: AppData = {
  ...emptyData(),
  transactions: [
    {
      id: '1',
      date: '2026-03-01',
      description: 'Salary ACME',
      amount: 300000,
      categoryId: 'salary',
    },
    {
      id: '2',
      date: '2026-03-02',
      description: 'REWE Markt',
      amount: -4510,
      categoryId: 'groceries',
    },
    { id: '3', date: '2026-03-05', description: 'Pizzeria', amount: -1800, categoryId: 'dining' },
    { id: '4', date: '2026-02-05', description: 'Old cinema', amount: -900, categoryId: 'leisure' },
  ],
};

async function openTransactions() {
  render(<App initial={DATA} />);
  await userEvent.click(screen.getByRole('button', { name: 'Transactions' }));
}
const bodyRows = () => screen.getAllByRole('row').slice(1);

beforeEach(() => localStorage.clear());

test('lists the selected month, newest first', async () => {
  await openTransactions();
  expect(bodyRows().map((row) => within(row).getAllByRole('cell')[1].textContent)).toEqual([
    'Pizzeria',
    'REWE Markt',
    'Salary ACME',
  ]);
  expect(screen.getByRole('status')).toHaveTextContent('3 transactions in March 2026');
});

test('searches, filters by type and widens to all months', async () => {
  await openTransactions();
  await userEvent.type(screen.getByLabelText('Search transactions'), 'rewe');
  expect(bodyRows()).toHaveLength(1);

  await userEvent.clear(screen.getByLabelText('Search transactions'));
  await userEvent.selectOptions(screen.getByLabelText('Type filter'), 'expense');
  expect(bodyRows()).toHaveLength(2);

  await userEvent.click(screen.getByLabelText('All months'));
  expect(bodyRows()).toHaveLength(3);
});

test('sorts by amount when the header is clicked', async () => {
  await openTransactions();
  await userEvent.click(screen.getByRole('button', { name: /Amount/ }));
  expect(within(bodyRows()[0]).getByText('Salary ACME')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Amount/ }));
  expect(within(bodyRows()[0]).getByText('REWE Markt')).toBeInTheDocument();
});

test('changes a category and deletes a transaction', async () => {
  await openTransactions();
  await userEvent.selectOptions(screen.getByLabelText('Category for Pizzeria'), 'leisure');
  expect(screen.getByLabelText('Category for Pizzeria')).toHaveValue('leisure');

  await userEvent.click(screen.getByRole('button', { name: 'Delete Pizzeria' }));
  expect(screen.queryByText('Pizzeria')).not.toBeInTheDocument();
  expect(bodyRows()).toHaveLength(2);
});

test('adds a manual transaction with validation', async () => {
  await openTransactions();
  await userEvent.click(screen.getByRole('button', { name: 'Add transaction' }));
  const form = screen.getByRole('form', { name: 'Add transaction' });

  await userEvent.click(within(form).getByRole('button', { name: 'Add' }));
  expect(within(form).getByRole('alert')).toHaveTextContent('Enter an amount');

  await userEvent.type(within(form).getByLabelText('Description'), 'Lidl cash');
  await userEvent.type(within(form).getByLabelText('Amount'), '12,50');
  await userEvent.clear(within(form).getByLabelText('Date'));
  await userEvent.type(within(form).getByLabelText('Date'), '2026-03-10');
  await userEvent.click(within(form).getByRole('button', { name: 'Add' }));

  expect(screen.queryByRole('form')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Category for Lidl cash')).toHaveValue('groceries');
  expect(screen.getByRole('status')).toHaveTextContent('4 transactions');
});
