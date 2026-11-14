import { formatDate, formatMoney } from '../lib/format';
import type { RecurringPayment } from '../lib/recurring';
import { yearlyCost } from '../lib/recurring';

const MONTHS_PER_YEAR = 12;

interface RecurringPaymentsProps {
  payments: RecurringPayment[];
  currency: string;
  categoryName: (id: string) => string;
}

export function RecurringPayments({ payments, currency, categoryName }: RecurringPaymentsProps) {
  const yearly = yearlyCost(payments);

  return (
    <section className="card card--wide">
      <h2>Recurring payments</h2>
      <p className="card__subtitle">
        {payments.length} detected ·{' '}
        <strong>{formatMoney(yearly / MONTHS_PER_YEAR, currency)}</strong> per month ·{' '}
        <strong>{formatMoney(yearly, currency)}</strong> per year
      </p>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Payee</th>
              <th>Category</th>
              <th>Last charged</th>
              <th className="is-numeric">Per month</th>
              <th className="is-numeric">Per year</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.name}>
                <td>{payment.name}</td>
                <td>{categoryName(payment.categoryId)}</td>
                <td className="table__date">{formatDate(payment.lastDate)}</td>
                <td className="is-numeric">{formatMoney(payment.amount, currency)}</td>
                <td className="is-numeric">
                  {formatMoney(payment.amount * MONTHS_PER_YEAR, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
