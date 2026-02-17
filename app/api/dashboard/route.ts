import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import { IProduct, ProductSize } from '@/types';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // 1. Calculate today's sales
    const todaySales = await Sale.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          cashSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'Cash'] }, '$total', 0],
            },
          },
          momoSales: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'MoMo'] }, '$total', 0],
            },
          },
        },
      },
    ]);

    const stats = todaySales[0] || {
      totalSales: 0,
      cashSales: 0,
      momoSales: 0,
    };

    // 2. Identify top 5 selling products (by quantity)
    // We can look at all time or just this month. Let's do all time as per requirements implied
    // actually usually "top selling" implies a time frame, but let's do generally top selling
    // helping to identify best performers.
    const topProducts = await Sale.aggregate([
      {
        $group: {
          _id: { product: '$product', size: '$size' },
          quantity: { $sum: '$quantity' },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          product: '$_id.product',
          size: '$_id.size',
          quantity: 1,
        },
      },
    ]);

    // 3. Low stock alerts (closingStock < 10)
    const products = await Product.find({});
    const lowStockAlerts: any[] = [];
    let totalStockValue = 0;
    let totalProductsCount = 0;

    products.forEach((product: IProduct) => {
      product.sizes.forEach((size: ProductSize) => {
        // Count total products (unique SKUs basically)
        totalProductsCount++;
        
        // This is a rough estimation of value, we don't have cost price, 
        // so we can't calculate stock value accurately without price info in Product model
        // We will just return 0 or maybe we should have asked for price in Product model.
        // The requirement says "Total Stock Value". 
        // We can use the last sold unit price as proxy or just leave it for now.
        // Actually, let's not guess. The requirements don't strictly say we have cost price.
        // I'll skip stock value calculation for now or just put 0.
        
        if (size.closingStock < 10) {
          lowStockAlerts.push({
            product: product.name,
            size: size.size,
            stock: size.closingStock,
          });
        }
      });
    });

    return NextResponse.json({
      todayTotalSales: stats.totalSales,
      todayCashSales: stats.cashSales,
      todayMoMoSales: stats.momoSales,
      totalSalesToday: stats.totalSales, // Duplicate but requested in different contexts
      totalProducts: totalProductsCount,
      totalStockValue: 0, // Placeholder as we don't have cost price
      topProducts,
      lowStockAlerts,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
