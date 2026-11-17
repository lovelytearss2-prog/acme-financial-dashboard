import postgres from 'postgres';
import { formatCurrency } from '@/app/lib/utils';

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
  max: 1,
});

export default async function DashboardPage() {
  const [stats] = await sql`
    SELECT
      COUNT(*)::int AS total_invoices,
      COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::int AS total_revenue,
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::int AS pending_payments
    FROM invoices;
  `;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">
        ACME Financial Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-gray-500">Total Revenue</h2>
          <p className="mt-3 text-3xl font-bold text-blue-600">
            {formatCurrency(Number(stats.total_revenue))}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-gray-500">Total Invoices</h2>
          <p className="mt-3 text-3xl font-bold text-blue-600">
            {stats.total_invoices}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-gray-500">Pending Payments</h2>
          <p className="mt-3 text-3xl font-bold text-orange-500">
            {formatCurrency(Number(stats.pending_payments))}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-bold">Welcome to ACME!</h2>
        <p className="mt-3 text-gray-600">
          Manage your finances, customers and invoices in one place.
        </p>
      </div>
    </main>
  );
}