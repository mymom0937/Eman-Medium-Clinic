export interface Payment {
  _id?: string;
  paymentId: string;
  saleId?: string;
  serviceId?: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionReference?: string;
  notes?: string;
  recordedBy: string; // User ID
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

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
  paymentStatus?: PaymentStatus;
  recordedBy?: string;
  startDate?: string;
  endDate?: string;
} 