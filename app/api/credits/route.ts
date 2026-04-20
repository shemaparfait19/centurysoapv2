import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';

export async function GET() {
  await dbConnect();
  try {
    const credits = await Sale.find({
      paymentStatus: { $in: ['Pending', 'Partial'] },
    }).sort({ date: -1 });

    const totalOutstanding = credits.reduce((sum, s) => sum + (s.balance || 0), 0);

    return NextResponse.json({ credits, totalOutstanding });
  } catch (error) {
    console.error('Credits fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch credit sales' }, { status: 500 });
  }
}
