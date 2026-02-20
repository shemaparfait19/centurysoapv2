import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const worker = searchParams.get('worker');
    
    let query: any = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate))
      };
    } else if (startDate) {
      query.date = { $gte: startOfDay(new Date(startDate)) };
    }
    
    if (worker && worker !== 'all') {
      query.workerName = worker;
    }
    
    const sales = await Sale.find(query).sort({ date: -1 });
    
    // Aggregations
    const stats = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$grandTotal' },
          cashSales: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'Cash'] }, '$grandTotal', 0] }
          },
          momoSales: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'MoMo'] }, '$grandTotal', 0] }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Product Breakdown
    const productBreakdown = await Sale.aggregate([
      { $match: query },
      { $unwind: '$items' },
      {
        $group: {
          _id: { product: '$items.product', size: '$items.size' },
          quantity: { $sum: '$items.quantity' },
          total: { $sum: '$items.total' }
        }
      },
      { $sort: { quantity: -1 } },
      {
        $project: {
          _id: 0,
          product: '$_id.product',
          size: '$_id.size',
          quantity: 1,
          total: 1
        }
      }
    ]);
    
    return NextResponse.json({
      summary: stats[0] || { totalSales: 0, cashSales: 0, momoSales: 0, count: 0 },
      products: productBreakdown,
      sales: sales
    });
  } catch (error) {
    console.error('Custom report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
