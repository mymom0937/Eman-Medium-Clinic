export interface Payment {
  _id?: string;
  paymentId: string;
  patientId: string;
  patientName: string;
  
  // Order Integration
  orderId?: string;           // Reference to drug order or lab order
  orderType?: 'DRUG_ORDER' | 'LAB_TEST' | 'CONSULTATION' | 'OTHER';
  orderReference?: string;     // Human-readable order reference
  
  // Payment Details
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  // Enhanced for Drug Sales
  paymentType: 'DRUG_SALE' | 'LAB_TEST' | 'CONSULTATION' | 'OTHER';
  
  // Drug Sale Specific Fields (when paymentType === 'DRUG_SALE')
  items?: Array<{
    drugId: string;
    drugName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  
  // General Payment Fields
  discount: number;
  finalAmount: number;
  transactionReference?: string;
  notes?: string;
  
  // Metadata
  recordedBy: string;
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