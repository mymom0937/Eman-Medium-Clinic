import { LAB_TEST_STATUS, LAB_TEST_TYPES } from '@/constants/lab-test-types';

export interface LabResult {
  _id: string;
  labResultId?: string; // Unique lab result ID like LAB000001 (optional for now)
  patientId: string;
  patientName: string;
  testType: keyof typeof LAB_TEST_TYPES;
  testName: string;
  status: keyof typeof LAB_TEST_STATUS;
  requestedBy: string; // Nurse ID
  requestedAt: Date;
  completedBy?: string; // Laboratorist ID
  completedAt?: Date;
  results?: LabTestResult[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabTestResult {
  parameter: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  isAbnormal: boolean;
  notes?: string;
}

export interface CreateLabResultRequest {
  patientId: string;
  patientName: string;
  testType: keyof typeof LAB_TEST_TYPES;
  testName: string;
  notes?: string;
}

export interface UpdateLabResultRequest {
  status?: keyof typeof LAB_TEST_STATUS;
  results?: LabTestResult[];
  notes?: string;
}

export interface LabResultFilters {
  patientId?: string;
  status?: keyof typeof LAB_TEST_STATUS;
  testType?: keyof typeof LAB_TEST_TYPES;
  requestedBy?: string;
  completedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface LabResultStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
} 