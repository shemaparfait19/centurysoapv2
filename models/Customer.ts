import mongoose, { Schema } from 'mongoose';
import { ICustomer } from '@/types';

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for letter-by-letter search (AJAX search)
CustomerSchema.index({ name: 'text' });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
