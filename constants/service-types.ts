export const SERVICE_TYPES = {
  INJECTION: 'INJECTION',
  BLOOD_PRESSURE_CHECK: 'BLOOD_PRESSURE_CHECK',
  DIABETES_SCREENING: 'DIABETES_SCREENING',
  TEMPERATURE_CHECK: 'TEMPERATURE_CHECK',
  WEIGHT_CHECK: 'WEIGHT_CHECK',
  HEIGHT_CHECK: 'HEIGHT_CHECK',
  BASIC_CONSULTATION: 'BASIC_CONSULTATION',
  DRESSING: 'DRESSING',
  WOUND_CLEANING: 'WOUND_CLEANING',
  OTHER: 'OTHER',
} as const;

export type ServiceType = typeof SERVICE_TYPES[keyof typeof SERVICE_TYPES];

export const SERVICE_LABELS = {
  [SERVICE_TYPES.INJECTION]: 'Injection Service',
  [SERVICE_TYPES.BLOOD_PRESSURE_CHECK]: 'Blood Pressure Check',
  [SERVICE_TYPES.DIABETES_SCREENING]: 'Diabetes Screening',
  [SERVICE_TYPES.TEMPERATURE_CHECK]: 'Temperature Check',
  [SERVICE_TYPES.WEIGHT_CHECK]: 'Weight Check',
  [SERVICE_TYPES.HEIGHT_CHECK]: 'Height Check',
  [SERVICE_TYPES.BASIC_CONSULTATION]: 'Basic Consultation',
  [SERVICE_TYPES.DRESSING]: 'Wound Dressing',
  [SERVICE_TYPES.WOUND_CLEANING]: 'Wound Cleaning',
  [SERVICE_TYPES.OTHER]: 'Other Service',
} as const;

export const SERVICE_DESCRIPTIONS = {
  [SERVICE_TYPES.INJECTION]: 'Administration of prescribed injections',
  [SERVICE_TYPES.BLOOD_PRESSURE_CHECK]: 'Blood pressure measurement and recording',
  [SERVICE_TYPES.DIABETES_SCREENING]: 'Blood glucose level testing',
  [SERVICE_TYPES.TEMPERATURE_CHECK]: 'Body temperature measurement',
  [SERVICE_TYPES.WEIGHT_CHECK]: 'Body weight measurement',
  [SERVICE_TYPES.HEIGHT_CHECK]: 'Height measurement',
  [SERVICE_TYPES.BASIC_CONSULTATION]: 'Basic health consultation and advice',
  [SERVICE_TYPES.DRESSING]: 'Wound dressing and bandaging',
  [SERVICE_TYPES.WOUND_CLEANING]: 'Wound cleaning and disinfection',
  [SERVICE_TYPES.OTHER]: 'Other medical services',
} as const;

export const SERVICE_PRICES = {
  [SERVICE_TYPES.INJECTION]: 50,
  [SERVICE_TYPES.BLOOD_PRESSURE_CHECK]: 30,
  [SERVICE_TYPES.DIABETES_SCREENING]: 40,
  [SERVICE_TYPES.TEMPERATURE_CHECK]: 20,
  [SERVICE_TYPES.WEIGHT_CHECK]: 15,
  [SERVICE_TYPES.HEIGHT_CHECK]: 15,
  [SERVICE_TYPES.BASIC_CONSULTATION]: 100,
  [SERVICE_TYPES.DRESSING]: 60,
  [SERVICE_TYPES.WOUND_CLEANING]: 45,
  [SERVICE_TYPES.OTHER]: 50,
} as const;

export const SERVICE_OPTIONS = Object.entries(SERVICE_LABELS).map(([value, label]) => ({
  value,
  label,
  price: SERVICE_PRICES[value as ServiceType],
  description: SERVICE_DESCRIPTIONS[value as ServiceType],
}));

export const INJECTION_TYPES = [
  'Intramuscular (IM)',
  'Subcutaneous (SC)',
  'Intravenous (IV)',
  'Intradermal (ID)',
  'Other',
] as const;

export const INJECTION_SITES = [
  'Deltoid (Arm)',
  'Gluteus (Buttock)',
  'Vastus Lateralis (Thigh)',
  'Abdomen',
  'Other',
] as const;
