import mongoose, { Schema } from 'mongoose';
import { IProduct } from '@/types';

const BatchEntrySchema = new Schema({
  batchNumber: { type: String, required: true },
  receivedDate: { type: Date, required: true },
  quantityIn: { type: Number, required: true },
  quantitySold: { type: Number, default: 0 },
  remaining: { type: Number, required: true },
});

const ProductSizeSchema = new Schema({
  size: { type: String, required: true },
  unit: { type: String, required: true },
  openingStock: { type: Number, default: 0 },
  stockIn: { type: Number, default: 0 },
  stockSold: { type: Number, default: 0 },
  closingStock: { type: Number, default: 0 },
  batches: { type: [BatchEntrySchema], default: [] },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, unique: true },
    sizes: [ProductSizeSchema],
  },
  {
    timestamps: true,
  }
);

// In development, delete the cached model so schema changes (e.g. new fields)
// are picked up without restarting the dev server.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models['Product'];
}

export default mongoose.models['Product'] || mongoose.model<IProduct>('Product', ProductSchema);
