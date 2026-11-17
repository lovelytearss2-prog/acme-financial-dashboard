import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
  max: 1,
});

// Update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const { customerId, amount } = await request.json();

    if (
      !customerId ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return NextResponse.json(
        { error: 'Please provide a customer and a valid amount' },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(Number(amount) * 100);

    const [invoice] = await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount = ${amountInCents}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Could not update invoice' },
      { status: 500 }
    );
  }
}

// Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    const [invoice] = await sql`
      DELETE FROM invoices
      WHERE id = ${id}
      RETURNING id
    `;

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Could not delete invoice' },
      { status: 500 }
    );
  }
}