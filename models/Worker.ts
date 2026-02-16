import mongoose, { Schema } from 'mongoose';
import { IWorker } from '@/types';

const WorkerSchema = new Schema<IWorker>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Worker || mongoose.model<IWorker>('Worker', WorkerSchema);
