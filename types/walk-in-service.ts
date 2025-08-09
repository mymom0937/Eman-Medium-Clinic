export interface WalkInService {
  _id: string;
  serviceId: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  serviceType: string;
  serviceDetails: {
    injectionType?: string;
    injectionSite?: string;
    bloodPressure?: string;
    bloodGlucose?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    notes?: string;
  };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalkInServiceRequest {
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  serviceType: string;
  serviceDetails: {
    injectionType?: string;
    injectionSite?: string;
    bloodPressure?: string;
    bloodGlucose?: string;
    temperature?: string;
    weight?: string;
    height?: string;
    notes?: string;
  };
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  recordedBy: string;
}

export interface UpdateWalkInServiceRequest extends Partial<CreateWalkInServiceRequest> {
  updatedAt?: Date;
}

export interface WalkInServiceStats {
  totalServices: number;
  totalRevenue: number;
  todayServices: number;
  todayRevenue: number;
  pendingPayments: number;
  completedServices: number;
}
