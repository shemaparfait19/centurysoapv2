import mongoose, { Schema } from 'mongoose';
import { ISale } from '@/types';

const SaleSchema = new Schema<ISale>(
  {
    date: { type: Date, required: true },
    clientName: { type: String, required: true },
    workerName: { type: String, required: true },
    product: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'MoMo'], required: true },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
SaleSchema.index({ date: -1 });
SaleSchema.index({ product: 1 });
SaleSchema.index({ workerName: 1 });
SaleSchema.index({ paymentMethod: 1 });

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);
