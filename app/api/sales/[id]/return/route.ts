import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import { ProductSize } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  try {
    const { note } = await request.json().catch(() => ({ note: '' }));

    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    if (sale.returned) return NextResponse.json({ error: 'Sale already returned' }, { status: 400 });

    // Restore stock for every item in the sale
    const items = sale.items && sale.items.length > 0
      ? sale.items
      : [{ product: (sale as any).product, size: (sale as any).size, quantity: (sale as any).quantity }];

    for (const item of items) {
      const product = await Product.findOne({ name: item.product });
      if (!product) continue;
      const sizeIndex = product.sizes.findIndex((s: ProductSize) => s.size === item.size);
      if (sizeIndex === -1) continue;
      await Product.findByIdAndUpdate(product._id, {
        $inc: {
          [`sizes.${sizeIndex}.stockSold`]: -item.quantity,
          [`sizes.${sizeIndex}.closingStock`]: item.quantity,
        },
      });
    }

    // Mark the sale as returned
    sale.returned = true;
    sale.returnDate = new Date();
    sale.returnNote = note || '';
    await sale.save();

    return NextResponse.json({ message: 'Return recorded successfully' });
  } catch (error) {
    console.error('Return error:', error);
    return NextResponse.json({ error: 'Failed to record return' }, { status: 500 });
  }
}
