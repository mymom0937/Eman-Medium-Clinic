export interface Payment {
  id: string;
  saleId?: string;
  serviceId?: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  processedBy: string; // User ID
  processedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'insurance' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentFormData {
  saleId?: string;
  serviceId?: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface PaymentSearchParams {
  patientId?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  processedBy?: string;
  startDate?: string;
  endDate?: string;
} 