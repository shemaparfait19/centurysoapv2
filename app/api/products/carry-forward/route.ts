import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { IProduct, ProductSize } from '@/types';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Fetch all products
    const products = await Product.find({});
    
    for (const product of products) {
      product.sizes = product.sizes.map((size: ProductSize) => {
        // Carry forward: Opening = Closing
        // Reset: StockIn = 0, StockSold = 0
        return {
          ...size,
          openingStock: size.closingStock,
          stockIn: 0,
          stockSold: 0,
          // closingStock remains same until new transactions occur
        };
      });
      await product.save();
    }
    
    return NextResponse.json({ message: 'Stock carried forward successfully' });
  } catch (error) {
    console.error('Carry forward error:', error);
    return NextResponse.json({ error: 'Failed to carry forward stock' }, { status: 500 });
  }
}
