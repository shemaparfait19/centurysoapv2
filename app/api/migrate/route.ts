import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Find sales that don't have the new 'items' structure
    const legacySales = await Sale.find({ 
      $or: [
        { items: { $exists: false } },
        { items: { $size: 0 } }
      ]
    });
    
    let updatedCount = 0;
    
    for (const sale of legacySales) {
      const saleObj = sale.toObject();
      
      // Map old fields to new ones
      const updateData = {
        customer: {
          name: saleObj.clientName || 'Legacy Customer',
          phone: 'N/A'
        },
        items: [{
          product: saleObj.product,
          size: saleObj.size,
          quantity: saleObj.quantity,
          unitPrice: saleObj.unitPrice,
          total: saleObj.total
        }],
        grandTotal: saleObj.total || 0
      };
      
      await Sale.findByIdAndUpdate(sale._id, { $set: updateData });
      updatedCount++;
    }
    
    return NextResponse.json({ 
      message: `Successfully migrated ${updatedCount} legacy sales.`,
      found: legacySales.length
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
