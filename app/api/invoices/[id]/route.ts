import postgres from 'postgres';
import { NextResponse } from 'next/server';

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { customerId, amount } = await request.json();

    const amountInCents = Math.round(Number(amount) * 100);

    if (
      !customerId ||
      !Number.isFinite(amountInCents) ||
      amountInCents <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid customer or amount' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount = ${amountInCents}
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update invoice error:', error);

    return NextResponse.json(
      { error: 'Could not update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;

    const result = await sql`
      DELETE FROM invoices
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete invoice error:', error);

    return NextResponse.json(
      { error: 'Could not delete invoice' },
      { status: 500 }
    );
  }
}