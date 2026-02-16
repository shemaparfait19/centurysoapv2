import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
  await dbConnect();

  try {
    const products = await Product.find({});
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
