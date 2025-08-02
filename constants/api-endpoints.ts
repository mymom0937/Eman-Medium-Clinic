export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGN_IN: '/api/auth/sign-in',
    SIGN_UP: '/api/auth/sign-up',
    SIGN_OUT: '/api/auth/sign-out',
    VERIFY: '/api/auth/verify',
  },

  // Drugs/Inventory
  DRUGS: {
    LIST: '/api/drugs',
    CREATE: '/api/drugs',
    UPDATE: (id: string) => `/api/drugs/${id}`,
    DELETE: (id: string) => `/api/drugs/${id}`,
    GET_BY_ID: (id: string) => `/api/drugs/${id}`,
    SEARCH: '/api/drugs/search',
    LOW_STOCK: '/api/drugs/low-stock',
  },

  // Sales
  SALES: {
    LIST: '/api/sales',
    CREATE: '/api/sales',
    UPDATE: (id: string) => `/api/sales/${id}`,
    DELETE: (id: string) => `/api/sales/${id}`,
    GET_BY_ID: (id: string) => `/api/sales/${id}`,
    ANALYTICS: '/api/sales/analytics',
    DAILY_REPORT: '/api/sales/daily-report',
  },

  // Patients
  PATIENTS: {
    LIST: '/api/patients',
    CREATE: '/api/patients',
    UPDATE: (id: string) => `/api/patients/${id}`,
    DELETE: (id: string) => `/api/patients/${id}`,
    GET_BY_ID: (id: string) => `/api/patients/${id}`,
    SEARCH: '/api/patients/search',
    GET_BY_PATIENT_ID: (patientId: string) => `/api/patients/patient-id/${patientId}`,
    HISTORY: (id: string) => `/api/patients/${id}/history`,
  },

  // Payments
  PAYMENTS: {
    LIST: '/api/payments',
    CREATE: '/api/payments',
    UPDATE: (id: string) => `/api/payments/${id}`,
    DELETE: (id: string) => `/api/payments/${id}`,
    GET_BY_ID: (id: string) => `/api/payments/${id}`,
    ANALYTICS: '/api/payments/analytics',
  },

  // Lab Results
  LAB_RESULTS: {
    LIST: '/api/lab-results',
    CREATE: '/api/lab-results',
    UPDATE: (id: string) => `/api/lab-results/${id}`,
    DELETE: (id: string) => `/api/lab-results/${id}`,
    GET_BY_ID: (id: string) => `/api/lab-results/${id}`,
    GET_BY_PATIENT: (patientId: string) => `/api/lab-results/patient/${patientId}`,
    GET_PENDING: '/api/lab-results/pending',
    GET_COMPLETED: '/api/lab-results/completed',
    UPDATE_STATUS: (id: string) => `/api/lab-results/${id}/status`,
  },

  // Drug Orders
  DRUG_ORDERS: {
    LIST: '/api/drug-orders',
    CREATE: '/api/drug-orders',
    UPDATE: (id: string) => `/api/drug-orders/${id}`,
    DELETE: (id: string) => `/api/drug-orders/${id}`,
    GET_BY_ID: (id: string) => `/api/drug-orders/${id}`,
    GET_BY_PATIENT: (patientId: string) => `/api/drug-orders/patient/${patientId}`,
    GET_PENDING: '/api/drug-orders/pending',
    GET_COMPLETED: '/api/drug-orders/completed',
    UPDATE_STATUS: (id: string) => `/api/drug-orders/${id}/status`,
  },

  // Upload
  UPLOAD: {
    IMAGE: '/api/upload/image',
    DOCUMENT: '/api/upload/document',
  },

  // Reports
  REPORTS: {
    SALES: '/api/reports/sales',
    INVENTORY: '/api/reports/inventory',
    PATIENTS: '/api/reports/patients',
    LAB_RESULTS: '/api/reports/lab-results',
    DRUG_ORDERS: '/api/reports/drug-orders',
  },

  // Webhooks
  WEBHOOKS: {
    CLERK: '/api/webhooks/clerk',
  },
} as const; 