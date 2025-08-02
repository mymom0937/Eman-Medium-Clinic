export interface Sale {
  id: string;
  patientId: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  soldBy: string; // User ID
  soldAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  drugId: string;
  drugName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'insurance';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface SaleFormData {
  patientId: string;
  items: {
    drugId: string;
    quantity: number;
  }[];
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface SaleSearchParams {
  patientId?: string;
  soldBy?: string;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
} 