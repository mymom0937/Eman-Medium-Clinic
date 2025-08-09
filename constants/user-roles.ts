export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  NURSE: 'NURSE',
  LABORATORIST: 'LABORATORIST',
  PHARMACIST: 'PHARMACIST',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_LABELS = {
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLES.NURSE]: 'Nurse',
  [USER_ROLES.LABORATORIST]: 'Laboratorist',
  [USER_ROLES.PHARMACIST]: 'Pharmacist',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    'dashboard:read',
    'inventory:read',
    'inventory:write',
    'patients:read',
    'patients:write',
    'payments:read',
    'payments:write',
    'lab-results:read',
    'lab-results:write',
    'reports:read',
    'users:read',
    'users:write',
    'walk-in-services:read',
    'walk-in-services:write',
  ],
  [USER_ROLES.NURSE]: [
    'dashboard:read',
    'patients:read',
    'patients:write',
    'lab-results:read',
    'lab-results:write',
    'drug-orders:read',
    'drug-orders:write',
  ],
  [USER_ROLES.LABORATORIST]: [
    'dashboard:read',
    'patients:read',
    'lab-results:read',
    'lab-results:write',
    'lab-tests:read',
    'lab-tests:write',
  ],
  [USER_ROLES.PHARMACIST]: [
    'dashboard:read',
    'inventory:read',
    'inventory:write',
    'payments:read',
    'payments:write',
    'drug-orders:read',
    'drug-orders:write',
    'walk-in-services:read',
    'walk-in-services:write',
  ],
} as const;

export const ROLE_OPTIONS = [
  { value: USER_ROLES.SUPER_ADMIN, label: ROLE_LABELS[USER_ROLES.SUPER_ADMIN] },
  { value: USER_ROLES.NURSE, label: ROLE_LABELS[USER_ROLES.NURSE] },
  { value: USER_ROLES.LABORATORIST, label: ROLE_LABELS[USER_ROLES.LABORATORIST] },
  { value: USER_ROLES.PHARMACIST, label: ROLE_LABELS[USER_ROLES.PHARMACIST] },
]; 