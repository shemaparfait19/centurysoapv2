import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import { ProductSize } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  try {
    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  try {
    const sale = await Sale.findById(id);
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

    // Restore stock
    const product = await Product.findOne({ name: sale.product });
    if (product) {
      const sizeIndex = product.sizes.findIndex((s: ProductSize) => s.size === sale.size);
      if (sizeIndex > -1) {
        product.sizes[sizeIndex].stockSold -= sale.quantity;
        product.sizes[sizeIndex].closingStock += sale.quantity;
        await product.save();
      }
    }

    await Sale.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
