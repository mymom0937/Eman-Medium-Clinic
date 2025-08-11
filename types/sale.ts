export interface SaleItem {
  drugId: string;
  drugName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  _id: string;
  saleId: string;
  source: 'EXTERNAL_PRESCRIPTION' | 'OTC' | 'ORDER';
  externalRef?: {
    issuer?: string;
    prescriptionNo?: string;
    attachmentUrl?: string;
  };
  drugOrderId?: string;
  patientName?: string;
  patientPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY';
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleRequest {
  source: 'EXTERNAL_PRESCRIPTION' | 'OTC' | 'ORDER';
  externalRef?: {
    issuer?: string;
    prescriptionNo?: string;
    attachmentUrl?: string;
  };
  drugOrderId?: string;
  patientName?: string;
  patientPhone?: string;
  items: Array<{ drugId: string; quantity: number; unitPrice?: number }>;
  discount?: number;
  tax?: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY';
  paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID';
}


