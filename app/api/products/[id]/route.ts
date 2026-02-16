import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { ProductSize } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const updates = await request.json();

  try {
    const product = await Product.findById(id);
    if (!product) {
      console.error('Product not found:', id);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (updates.sizes) {
      // Recalculate totals for affected sizes
      product.sizes = product.sizes.map((size: ProductSize) => {
        const updateSize = updates.sizes.find((s: ProductSize) => s.size === size.size);
        if (updateSize) {
          const newSize = { ...size, ...updateSize };
          // Ensure calculation logic is consistent
          // Closing Stock = Opening Stock + Stock In - Stock Sold
          newSize.closingStock = 
            (newSize.openingStock || 0) + 
            (newSize.stockIn || 0) - 
            (newSize.stockSold || 0);
          return newSize;
        }
        return size;
      });
    }

    await product.save();
    return NextResponse.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
