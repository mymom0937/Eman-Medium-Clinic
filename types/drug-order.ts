export const DRUG_ORDER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DISPENSED: 'DISPENSED',
  CANCELLED: 'CANCELLED',
} as const;

export const DRUG_ORDER_STATUS_LABELS = {
  [DRUG_ORDER_STATUS.PENDING]: 'Pending',
  [DRUG_ORDER_STATUS.APPROVED]: 'Approved',
  [DRUG_ORDER_STATUS.DISPENSED]: 'Dispensed',
  [DRUG_ORDER_STATUS.CANCELLED]: 'Cancelled',
} as const;

export interface DrugOrder {
  _id: string;
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
  items: DrugOrderItem[];
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrugOrderItem {
  drugId: string;
  drugName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosage?: string;
  instructions?: string;
}

export interface CreateDrugOrderRequest {
  patientId: string;
  patientName: string;
  labResultId?: string;
  items: Omit<DrugOrderItem, 'totalPrice'>[];
  notes?: string;
}

export interface UpdateDrugOrderRequest {
  status?: keyof typeof DRUG_ORDER_STATUS;
  items?: Omit<DrugOrderItem, 'totalPrice'>[];
  notes?: string;
}

export interface DrugOrderFilters {
  patientId?: string;
  status?: keyof typeof DRUG_ORDER_STATUS;
  orderedBy?: string;
  approvedBy?: string;
  dispensedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DrugOrderStats {
  total: number;
  pending: number;
  approved: number;
  dispensed: number;
  cancelled: number;
} 