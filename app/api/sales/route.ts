import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import { IProduct, ProductSize } from '@/types';

export async function GET(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const product = searchParams.get('product');
  const worker = searchParams.get('worker');
  const paymentMethod = searchParams.get('paymentMethod');
  const paymentStatus = searchParams.get('paymentStatus');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  let query: any = {};

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    query.date = { $gte: new Date(startDate) };
  }

  if (product) query['items.product'] = product;
  if (worker) query.workerName = worker;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  try {
    const sales = await Sale.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Sale.countDocuments(query);
    const totalAmount = await Sale.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $ifNull: ['$grandTotal', '$total'] } } 
        } 
      }
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // 1. Validate Product Stock for ALL items BEFORE creating sale
    for (const item of body.items) {
      const product = await Product.findOne({ name: item.product });
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product}` }, { status: 404 });
      }

      const sizeIndex = product.sizes.findIndex((s: ProductSize) => s.size === item.size);
      if (sizeIndex === -1) {
        return NextResponse.json({ error: `Size not found: ${item.size} for ${item.product}` }, { status: 404 });
      }

      const availableStock = product.sizes[sizeIndex].closingStock;
      if (availableStock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${item.product} (${item.size}). Only ${availableStock} units available.` 
        }, { status: 400 });
      }
    }

    // 2. Compute payment fields
    const grandTotal = body.items.reduce((sum: number, item: any) => sum + item.total, 0);
    let paymentStatus: 'Paid' | 'Partial' | 'Pending' = 'Paid';
    let amountPaid = grandTotal;
    let balance = 0;
    const payments: any[] = [];

    if (body.paymentMethod === 'Credit') {
      const initial = Number(body.initialPayment) || 0;
      amountPaid = initial;
      balance = grandTotal - initial;
      if (initial === 0) paymentStatus = 'Pending';
      else if (initial < grandTotal) paymentStatus = 'Partial';
      else { paymentStatus = 'Paid'; balance = 0; }
      if (initial > 0) {
        payments.push({ amount: initial, method: body.initialPaymentMethod || 'Cash', date: new Date(body.date) });
      }
    }

    // 3. Create Sale (only if all stock levels are sufficient)
    const sale = await Sale.create({
      ...body,
      grandTotal,
      paymentStatus,
      amountPaid,
      balance,
      payments,
    });

    // 4. Update Product Stock for ALL items (FIFO batch deduction)
    for (const item of body.items) {
      const product = await Product.findOne({ name: item.product });
      const sizeIndex = product.sizes.findIndex((s: ProductSize) => s.size === item.size);
      const size = product.sizes[sizeIndex];

      // Update size-level totals atomically
      await Product.findByIdAndUpdate(product._id, {
        $inc: {
          [`sizes.${sizeIndex}.stockSold`]: item.quantity,
          [`sizes.${sizeIndex}.closingStock`]: -item.quantity,
        },
      });

      // FIFO batch deduction — atomic $inc per batch entry
      if (size.batches && size.batches.length > 0) {
        const sorted = [...size.batches]
          .map((b: any, origIndex: number) => ({ ...b.toObject(), origIndex }))
          .sort((a: any, b: any) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

        let left = item.quantity;
        for (const batch of sorted) {
          if (left <= 0) break;
          const take = Math.min(batch.remaining, left);
          left -= take;
          await Product.findByIdAndUpdate(product._id, {
            $inc: {
              [`sizes.${sizeIndex}.batches.${batch.origIndex}.quantitySold`]: take,
              [`sizes.${sizeIndex}.batches.${batch.origIndex}.remaining`]: -take,
            },
          });
        }
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Sale creation error:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
