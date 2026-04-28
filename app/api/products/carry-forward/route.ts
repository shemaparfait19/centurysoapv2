import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { IProduct, ProductSize } from '@/types';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const products = await Product.find({});

    for (const product of products) {
      product.sizes = product.sizes.map((size: ProductSize) => {
        return {
          ...size.toObject ? size.toObject() : size,
          openingStock: size.closingStock,
          stockIn: 0,
          stockSold: 0,
          batches: [], // clear batches — remaining carried into new openingStock
        };
      });
      product.markModified('sizes');
      await product.save();
    }

    return NextResponse.json({ message: 'Stock carried forward successfully' });
  } catch (error) {
    console.error('Carry forward error:', error);
    return NextResponse.json({ error: 'Failed to carry forward stock' }, { status: 500 });
  }
}
