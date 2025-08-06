export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  INVENTORIES: '/inventories',
  PATIENTS: '/patients',
  PAYMENTS: '/payments',
  LAB_RESULTS: '/lab-results',
  DRUG_ORDERS: '/drug-orders',
  REPORTS: '/reports',
  PROFILE: '/profile',
} as const;

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.INVENTORIES,
  ROUTES.PATIENTS,
  ROUTES.PAYMENTS,
  ROUTES.LAB_RESULTS,
  ROUTES.DRUG_ORDERS,
  ROUTES.REPORTS,
];

export const PUBLIC_ROUTES = [
  '/',
  '/sign-in',
  '/sign-up',
] as const; 