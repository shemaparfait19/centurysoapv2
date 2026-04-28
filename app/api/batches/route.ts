import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
  await dbConnect();
  try {
    const products = await Product.find({});

    // Flatten all batches across all products/sizes
    const rows: any[] = [];

    for (const product of products) {
      for (const size of product.sizes) {
        const batches = (size as any).batches || [];
        for (const batch of batches) {
          rows.push({
            batchNumber: batch.batchNumber,
            receivedDate: batch.receivedDate,
            product: product.name,
            size: size.size,
            unit: size.unit,
            quantityIn: batch.quantityIn,
            quantitySold: batch.quantitySold,
            remaining: batch.remaining,
            productId: product._id,
          });
        }
      }
    }

    // Group by batchNumber
    const grouped: Record<string, { batchNumber: string; receivedDate: Date; items: any[]; totalIn: number; totalSold: number; totalRemaining: number }> = {};

    for (const row of rows) {
      if (!grouped[row.batchNumber]) {
        grouped[row.batchNumber] = {
          batchNumber: row.batchNumber,
          receivedDate: row.receivedDate,
          items: [],
          totalIn: 0,
          totalSold: 0,
          totalRemaining: 0,
        };
      }
      grouped[row.batchNumber].items.push(row);
      grouped[row.batchNumber].totalIn += row.quantityIn;
      grouped[row.batchNumber].totalSold += row.quantitySold;
      grouped[row.batchNumber].totalRemaining += row.remaining;
    }

    const batches = Object.values(grouped).sort(
      (a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
    );

    return NextResponse.json({ batches, totalRows: rows.length });
  } catch (error) {
    console.error('Batches fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }
}
