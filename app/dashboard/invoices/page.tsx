'use client';

import { useEffect, useState } from 'react';

type Invoice = {
  id: string;
  customerId: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
};

type Customer = {
  id: string;
  name: string;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadInvoices() {
    try {
      const response = await fetch('/api/invoices');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not load invoices');
      }

      setInvoices(data.invoices);
      setCustomers(data.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function addInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not save invoice');
      }

      setCustomerId('');
      setAmount('');
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save invoice');
    }
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not delete invoice');
      }

      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete invoice');
    }
  }

  function editInvoice(invoice: Invoice) {
    setEditingId(invoice.id);
    setCustomerId(invoice.customerId);
    setAmount((invoice.amount / 100).toFixed(2));
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;

    try {
      const response = await fetch(`/api/invoices/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, amount }),
      });

      if (!response.ok) {
        throw new Error('Could not update invoice');
      }

      setEditingId(null);
      setCustomerId('');
      setAmount('');
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update invoice');
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-6 text-3xl font-bold">ACME Invoices</h1>

      <form
        onSubmit={editingId ? saveEdit : addInvoice}
        className="mb-8 max-w-xl space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <select
          className="w-full rounded border p-3"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          required
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>

        <input
          className="w-full rounded border p-3"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount ($)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <button className="rounded bg-blue-600 px-5 py-3 text-white">
          {editingId ? 'Save Changes' : 'Add Invoice'}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setCustomerId('');
              setAmount('');
            }}
            className="ml-2 rounded bg-gray-500 px-5 py-3 text-white"
          >
            Cancel
          </button>
        )}
      </form>

      {error && (
        <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>
      )}

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Invoice List</h2>

        {loading ? (
          <p>Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p>No invoices found.</p>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex justify-between border-b py-4"
            >
              <div>
                <p className="font-semibold">{invoice.customer}</p>
                <p>${(invoice.amount / 100).toFixed(2)}</p>
                <p className="text-sm text-gray-500">{invoice.status}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => editInvoice(invoice)}
                  className="rounded bg-yellow-500 px-4 py-2 text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteInvoice(invoice.id)}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}