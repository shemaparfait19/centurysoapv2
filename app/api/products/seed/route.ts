import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { seedProducts } from '@/lib/seed-products';

export async function POST() {
  try {
    await dbConnect();
    const result = await seedProducts();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      error: 'Failed to seed products',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
