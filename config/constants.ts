export const APP_CONFIG = {
  name: 'Eman Clinic',
  version: '1.0.0',
  description: 'Digital Clinic Management System',
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  NURSE: 'NURSE',
  LABORATORIST: 'LABORATORIST',
  PHARMACIST: 'PHARMACIST',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  MOBILE_MONEY: 'MOBILE_MONEY',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export const SALE_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const SERVICE_BOOKING_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const GENDER_OPTIONS = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;

export const DRUG_CATEGORIES = [
  'Antibiotics',
  'Pain Relief',
  'Vitamins',
  'Diabetes',
  'Hypertension',
  'Respiratory',
  'Gastrointestinal',
  'Dermatological',
  'Ophthalmic',
  'Dental',
  'Other',
] as const;

export const SERVICE_CATEGORIES = [
  'Consultation',
  'Laboratory',
  'Radiology',
  'Surgery',
  'Vaccination',
  'Emergency',
  'Other',
] as const;

export const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Other',
] as const; 