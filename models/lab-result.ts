import mongoose, { Schema, Document } from 'mongoose';
import { LAB_TEST_STATUS, LAB_TEST_TYPES } from '@/constants/lab-test-types';

export interface ILabTestResult {
  parameter: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  notes?: string;
}

export interface ILabResult extends Document {
  patientId: string;
  patientName: string;
  testType: keyof typeof LAB_TEST_TYPES;
  testName: string;
  status: keyof typeof LAB_TEST_STATUS;
  requestedBy: string; // Nurse ID
  requestedAt: Date;
  completedBy?: string; // Laboratorist ID
  completedAt?: Date;
  results?: ILabTestResult[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabTestResultSchema = new Schema<ILabTestResult>({
  parameter: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true }, // Can be string or number
  unit: { type: String },
  referenceRange: { type: String },
  isAbnormal: { type: Boolean, default: false },
  notes: { type: String },
});

const LabResultSchema = new Schema<ILabResult>({
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  testType: { type: String, required: true, enum: Object.values(LAB_TEST_TYPES) },
  testName: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: Object.values(LAB_TEST_STATUS),
    default: 'PENDING'
  },
  requestedBy: { type: String, required: true }, // Nurse ID
  requestedAt: { type: Date, required: true, default: Date.now },
  completedBy: { type: String }, // Laboratorist ID
  completedAt: { type: Date },
  results: [LabTestResultSchema],
  notes: { type: String },
}, {
  timestamps: true,
});

// Indexes for better query performance
LabResultSchema.index({ patientId: 1, createdAt: -1 });
LabResultSchema.index({ status: 1 });
LabResultSchema.index({ requestedBy: 1 });
LabResultSchema.index({ completedBy: 1 });
LabResultSchema.index({ testType: 1 });

export const LabResult = mongoose.models.LabResult || mongoose.model<ILabResult>('LabResult', LabResultSchema); 