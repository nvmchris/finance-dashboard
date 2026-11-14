import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { emptyData } from '../lib/storage';
import type { AppData } from '../lib/types';

const DATA: AppData = {
  ...emptyData(),
  transactions: [
    { id: '1', date: '2026-03-02', description: 'REWE', amount: -9000, categoryId: 'groceries' },
    { id: '2', date: '2026-03-05', description: 'Pizzeria', amount: -6000, categoryId: 'dining' },
  ],
  budgets: [
    { categoryId: 'groceries', limit: 10000 },
    { categoryId: 'dining', limit: 5000 },
  ],
};

async function openBudgets(data = DATA) {
  render(<App initial={data} />);
  await userEvent.click(screen.getByRole('button', { name: 'Budgets' }));
}

beforeEach(() => localStorage.clear());

test('shows progress, status and totals for the month', async () => {
  await openBudgets();
  expect(screen.getByRole('status')).toHaveTextContent('€150.00 spent of €150.00 budgeted');
  expect(screen.getByRole('meter', { name: 'Dining out budget' })).toHaveAttribute(
    'aria-valuetext',
    '120% used, €10.00 over',
  );
  expect(screen.getByText(/Over budget/)).toBeInTheDocument();
  expect(screen.getByText(/Close to limit/)).toBeInTheDocument();
});

test('edits and removes a budget', async () => {
  await openBudgets();
  const field = screen.getByLabelText('Monthly limit for Dining out');
  await userEvent.clear(field);
  await userEvent.type(field, '100{Enter}');
  expect(screen.getByRole('meter', { name: 'Dining out budget' })).toHaveAttribute(
    'aria-valuetext',
    '60% used, €40.00 left',
  );

  await userEvent.click(screen.getByRole('button', { name: 'Remove budget for Dining out' }));
  expect(screen.queryByRole('meter', { name: 'Dining out budget' })).not.toBeInTheDocument();
});

test('adds a budget for a category without one', async () => {
  await openBudgets({ ...DATA, budgets: [] });
  expect(screen.getByText(/No budgets yet/)).toBeInTheDocument();
  const form = screen.getByRole('form', { name: 'Add budget' });

  await userEvent.click(within(form).getByRole('button', { name: 'Add budget' }));
  expect(within(form).getByRole('alert')).toHaveTextContent('greater than zero');

  await userEvent.selectOptions(within(form).getByLabelText('Category'), 'groceries');
  await userEvent.type(within(form).getByLabelText('Monthly limit'), '200');
  await userEvent.click(within(form).getByRole('button', { name: 'Add budget' }));
  expect(screen.getByRole('meter', { name: 'Groceries budget' })).toBeInTheDocument();
  expect(within(form).queryByRole('option', { name: 'Groceries' })).not.toBeInTheDocument();
});

test('the dashboard links to the budgets view', async () => {
  render(<App initial={DATA} />);
  await userEvent.click(screen.getByRole('button', { name: 'Manage' }));
  expect(screen.getByRole('form', { name: 'Add budget' })).toBeInTheDocument();
});
