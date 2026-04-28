import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  try {
    const { sizeIndex, batchNumber, receivedDate, quantityIn } = await request.json();

    if (!batchNumber || !receivedDate || !quantityIn || quantityIn <= 0) {
      return NextResponse.json({ error: 'batchNumber, receivedDate and quantityIn are required' }, { status: 400 });
    }

    const qty = Number(quantityIn);

    // Verify product + sizeIndex exist
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (sizeIndex < 0 || sizeIndex >= product.sizes.length) {
      return NextResponse.json({ error: 'Invalid size index' }, { status: 400 });
    }

    const newBatch = {
      batchNumber,
      receivedDate: new Date(receivedDate),
      quantityIn: qty,
      quantitySold: 0,
      remaining: qty,
    };

    // Use atomic operators — reliable for nested arrays
    const updated = await Product.findByIdAndUpdate(
      id,
      {
        $push: { [`sizes.${sizeIndex}.batches`]: newBatch },
        $inc: {
          [`sizes.${sizeIndex}.stockIn`]: qty,
          [`sizes.${sizeIndex}.closingStock`]: qty,
        },
      },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Add batch error:', error);
    return NextResponse.json({ error: 'Failed to add batch' }, { status: 500 });
  }
}
