import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function GET() {
  await dbConnect();
  try {
    const workers = await Worker.find({ active: true });
    return NextResponse.json(workers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const worker = await Worker.create(body);
    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}
