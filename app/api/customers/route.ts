import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const customers = await Customer.find(query).limit(10);
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Check if customer with this phone already exists
    let customer = await Customer.findOne({ phone: body.phone });
    
    if (customer) {
      // Update existing customer
      customer.name = body.name;
      if (body.email) customer.email = body.email;
      if (body.address) customer.address = body.address;
      await customer.save();
    } else {
      // Create new customer
      customer = await Customer.create(body);
    }
    
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Customer operation error:', error);
    return NextResponse.json({ error: 'Failed to process customer' }, { status: 500 });
  }
}
