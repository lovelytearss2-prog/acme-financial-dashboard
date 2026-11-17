import postgres from 'postgres';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
});

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const customers = await sql`
      SELECT id, name
      FROM customers
      ORDER BY name
    `;

    const invoices = await sql`
      SELECT
        invoices.id,
        invoices.customer_id AS "customerId",
        customers.name AS customer,
        invoices.amount,
        invoices.status,
        invoices.date
      FROM invoices
      JOIN customers
        ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
    `;

    return NextResponse.json({ invoices, customers });
  } catch (error) {
    console.error('GET invoices error:', error);
    return NextResponse.json(
      { error: 'Could not load invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { customerId, amount } = await request.json();

    const amountInCents = Math.round(Number(amount) * 100);

    if (!customerId || !Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json(
        { error: 'Please provide a customer and valid amount' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, 'pending', CURRENT_DATE)
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('POST invoice error:', error);
    return NextResponse.json(
      { error: 'Could not create invoice' },
      { status: 500 }
    );
  }
}