import mongoose, { Schema } from 'mongoose';
import { ISale } from '@/types';

const SaleItemSchema = new Schema({
  product: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
});

const PaymentRecordSchema = new Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Cash', 'MoMo'], required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
});

const SaleSchema = new Schema<ISale>(
  {
    date: { type: Date, required: true },
    customer: {
      name: { type: String, default: 'Walk-in' },
      phone: { type: String, default: 'N/A' },
      id: { type: Schema.Types.ObjectId, ref: 'Customer' },
    },
    workerName: { type: String, required: true },
    items: [SaleItemSchema],
    grandTotal: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'MoMo', 'Credit'], required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Pending'], default: 'Paid' },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    payments: [PaymentRecordSchema],
  },
  {
    timestamps: true,
  }
);

SaleSchema.index({ date: -1 });
SaleSchema.index({ 'customer.name': 1 });
SaleSchema.index({ workerName: 1 });
SaleSchema.index({ paymentMethod: 1 });
SaleSchema.index({ paymentStatus: 1 });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models['Sale'];
}

export default mongoose.models['Sale'] || mongoose.model<ISale>('Sale', SaleSchema);
