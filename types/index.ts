import { Document } from 'mongoose';

// Product Types
export interface BatchEntry {
  _id?: string;
  batchNumber: string;
  receivedDate: Date;
  quantityIn: number;
  quantitySold: number;
  remaining: number;
}

export interface ProductSize {
  size: string;
  unit: string;
  openingStock: number;
  stockIn: number;
  stockSold: number;
  closingStock: number;
  batches: BatchEntry[];
}

export interface IProduct extends Document {
  name: string;
  sizes: ProductSize[];
  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sale Types
export interface ISaleItem {
  product: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentRecord {
  _id?: string;
  amount: number;
  method: 'Cash' | 'MoMo';
  date: Date;
  note?: string;
}

export interface ISale extends Document {
  date: Date;
  customer: {
    name: string;
    phone: string;
    id?: string;
  };
  workerName: string;
  items: ISaleItem[];
  grandTotal: number;
  paymentMethod: 'Cash' | 'MoMo' | 'Credit';
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  amountPaid: number;
  balance: number;
  payments: PaymentRecord[];
  createdAt: Date;
}

// Worker Types
export interface IWorker extends Document {
  name: string;
  phone: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  todayTotalSales: number;
  todayCashSales: number;
  todayMoMoSales: number;
  totalProducts: number;
  totalSalesToday: number;
  topProducts: {
    product: string;
    size: string;
    quantity: number;
  }[];
  lowStockAlerts: {
    product: string;
    size: string;
    stock: number;
  }[];
}

// Daily Report
export interface DailyReport {
  date: string;
  totalSales: number;
  cashSales: number;
  momoSales: number;
  transactionCount: number;
  sales: ISale[];
  productBreakdown: {
    product: string;
    size: string;
    quantity: number;
    total: number;
  }[];
}

// Global mongoose type extension
declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}
