export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price: number;
  duration: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceCategory = 
  | 'consultation'
  | 'laboratory'
  | 'imaging'
  | 'procedure'
  | 'vaccination'
  | 'emergency'
  | 'other';

export interface ServiceFormData {
  name: string;
  description: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  serviceId: string;
  appointmentDate: Date;
  status: AppointmentStatus;
  notes?: string;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface AppointmentFormData {
  patientId: string;
  serviceId: string;
  appointmentDate: string;
  notes?: string;
}

export interface ServiceSearchParams {
  name?: string;
  category?: ServiceCategory;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
} 