import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  try {
    const { amount, method, note } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than 0' }, { status: 400 });
    }
    if (!method || !['Cash', 'MoMo'].includes(method)) {
      return NextResponse.json({ error: 'Payment method must be Cash or MoMo' }, { status: 400 });
    }

    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

    if (sale.paymentStatus === 'Paid') {
      return NextResponse.json({ error: 'This sale is already fully paid' }, { status: 400 });
    }

    const paying = Math.min(Number(amount), sale.balance);
    const newAmountPaid = (sale.amountPaid || 0) + paying;
    const newBalance = sale.grandTotal - newAmountPaid;

    sale.payments = sale.payments || [];
    sale.payments.push({ amount: paying, method, date: new Date(), note: note || '' });
    sale.amountPaid = newAmountPaid;
    sale.balance = Math.max(0, newBalance);
    sale.paymentStatus = sale.balance === 0 ? 'Paid' : 'Partial';

    await sale.save();
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Payment record error:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
