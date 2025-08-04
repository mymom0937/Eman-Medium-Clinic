export const BLOOD_TYPES = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
} as const;

export const BLOOD_TYPE_OPTIONS = [
  { value: BLOOD_TYPES.A_POSITIVE, label: 'A+' },
  { value: BLOOD_TYPES.A_NEGATIVE, label: 'A-' },
  { value: BLOOD_TYPES.B_POSITIVE, label: 'B+' },
  { value: BLOOD_TYPES.B_NEGATIVE, label: 'B-' },
  { value: BLOOD_TYPES.AB_POSITIVE, label: 'AB+' },
  { value: BLOOD_TYPES.AB_NEGATIVE, label: 'AB-' },
  { value: BLOOD_TYPES.O_POSITIVE, label: 'O+' },
  { value: BLOOD_TYPES.O_NEGATIVE, label: 'O-' },
]; 