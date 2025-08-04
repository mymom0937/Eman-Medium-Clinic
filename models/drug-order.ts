import mongoose, { Schema, Document } from 'mongoose';
import { DRUG_ORDER_STATUS } from '@/types/drug-order';

export interface IDrugOrderItem {
  drugId: string;
  drugName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosage?: string;
  instructions?: string;
}

export interface IDrugOrder extends Document {
  drugOrderId?: string; // Unique drug order ID like DRG000001 (optional for now)
  patientId: string;
  patientName: string;
  labResultId?: string; // Reference to lab result
  status: keyof typeof DRUG_ORDER_STATUS;
  orderedBy: string; // Nurse ID
  orderedAt: Date;
  approvedBy?: string; // Pharmacist ID
  approvedAt?: Date;
  dispensedBy?: string; // Pharmacist ID
  dispensedAt?: Date;
  items: IDrugOrderItem[];
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DrugOrderItemSchema = new Schema<IDrugOrderItem>({
  drugId: { type: String, required: true },
  drugName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  dosage: { type: String },
  instructions: { type: String },
});

const DrugOrderSchema = new Schema<IDrugOrder>({
  drugOrderId: { type: String, unique: true, sparse: true }, // Unique drug order ID
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  labResultId: { type: String }, // Reference to lab result
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(DRUG_ORDER_STATUS),
    default: 'PENDING'
  },
  orderedBy: { type: String, required: true }, // Nurse ID
  orderedAt: { type: Date, required: true, default: Date.now },
  approvedBy: { type: String }, // Pharmacist ID
  approvedAt: { type: Date },
  dispensedBy: { type: String }, // Pharmacist ID
  dispensedAt: { type: Date },
  items: [DrugOrderItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  notes: { type: String },
}, {
  timestamps: true,
});

// Pre-save middleware to calculate total amount
DrugOrderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  next();
});

// Indexes for better query performance
DrugOrderSchema.index({ patientId: 1, createdAt: -1 });
DrugOrderSchema.index({ status: 1 });
DrugOrderSchema.index({ orderedBy: 1 });
DrugOrderSchema.index({ approvedBy: 1 });
DrugOrderSchema.index({ dispensedBy: 1 });
DrugOrderSchema.index({ labResultId: 1 });
DrugOrderSchema.index({ drugOrderId: 1 });

// Force delete existing model and recreate it
if (mongoose.models.DrugOrder) {
  delete mongoose.models.DrugOrder;
}
export const DrugOrder = mongoose.model<IDrugOrder>('DrugOrder', DrugOrderSchema); 