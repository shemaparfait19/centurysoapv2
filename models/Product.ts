import mongoose, { Schema } from 'mongoose';
import { IProduct } from '@/types';

const ProductSizeSchema = new Schema({
  size: { type: String, required: true },
  unit: { type: String, required: true },
  openingStock: { type: Number, default: 0 },
  stockIn: { type: Number, default: 0 },
  stockSold: { type: Number, default: 0 },
  closingStock: { type: Number, default: 0 },
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

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
