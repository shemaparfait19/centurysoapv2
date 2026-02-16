import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { seedProducts } from '@/lib/seed-products';

export async function POST() {
  await dbConnect();
  
  try {
    const result = await seedProducts();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed products' }, { status: 500 });
  }
}
