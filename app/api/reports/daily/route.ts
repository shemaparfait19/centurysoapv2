import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');

  try {
    const selectedDate = dateStr ? new Date(dateStr) : new Date();
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    // 1. Calculate sales for the specific date
    const dailyStats = await Sale.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: { $ifNull: ['$grandTotal', '$total'] } },
          cashSales: {
            $sum: { 
              $cond: [
                { $eq: ['$paymentMethod', 'Cash'] }, 
                { $ifNull: ['$grandTotal', '$total'] }, 
                0
              ] 
            },
          },
          momoSales: {
            $sum: { 
              $cond: [
                { $eq: ['$paymentMethod', 'MoMo'] }, 
                { $ifNull: ['$grandTotal', '$total'] }, 
                0
              ] 
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // 2. Breakdown by product
    const productBreakdown = await Sale.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      // First, try to unwind new structure
      {
        $project: {
          items: {
            $ifNull: [
              '$items', 
              [{ product: '$product', size: '$size', quantity: '$quantity', total: '$total' }]
            ]
          }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: { product: '$items.product', size: '$items.size' },
          quantity: { $sum: '$items.quantity' },
          total: { $sum: '$items.total' },
        },
      },
      {
        $project: {
          _id: 0,
          product: '$_id.product',
          size: '$_id.size',
          quantity: 1,
          total: 1,
        },
      },
    ]);

    // 3. Get all sales for the day for the detailed list
    const sales = await Sale.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    const stats = dailyStats[0] || {
      totalSales: 0,
      cashSales: 0,
      momoSales: 0,
      count: 0,
    };

    return NextResponse.json({
      date: start.toISOString(),
      totalSales: stats.totalSales,
      cashSales: stats.cashSales,
      momoSales: stats.momoSales,
      transactionCount: stats.count,
      sales,
      productBreakdown,
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily report' },
      { status: 500 }
    );
  }
}
