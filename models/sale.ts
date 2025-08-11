import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
  drugId: string;
  drugName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ISale extends Document {
  saleId: string; // SAL000001
  source: 'EXTERNAL_PRESCRIPTION' | 'OTC' | 'ORDER';
  externalRef?: {
    issuer?: string;
    prescriptionNo?: string;
    attachmentUrl?: string;
  };
  drugOrderId?: string; // optional, when fulfilling an internal order
  patientName?: string;
  patientPhone?: string;
  items: ISaleItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY';
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
  drugId: { type: String, required: true },
  drugName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
});

const SaleSchema = new Schema<ISale>(
  {
    saleId: { type: String, required: true, unique: true, index: true },
    source: {
      type: String,
      required: true,
      enum: ['EXTERNAL_PRESCRIPTION', 'OTC', 'ORDER'],
      default: 'OTC',
    },
    externalRef: {
      issuer: { type: String },
      prescriptionNo: { type: String },
      attachmentUrl: { type: String },
    },
    drugOrderId: { type: String },
    patientName: { type: String },
    patientPhone: { type: String },
    items: { type: [SaleItemSchema], required: true, default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['CASH', 'CARD', 'MOBILE_MONEY'],
      default: 'CASH',
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'PAID',
    },
    recordedBy: { type: String, required: true },
  },
  { timestamps: true }
);

SaleSchema.index({ createdAt: -1 });
SaleSchema.index({ saleId: 1 });

export const Sale =
  mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);


