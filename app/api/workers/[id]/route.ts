import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Worker from '@/models/Worker';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const updates = await request.json();
  try {
    const worker = await Worker.findByIdAndUpdate(params.id, updates, { new: true });
    if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    return NextResponse.json(worker);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update worker' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const worker = await Worker.findByIdAndDelete(params.id);
    if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    return NextResponse.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete worker' }, { status: 500 });
  }
}
