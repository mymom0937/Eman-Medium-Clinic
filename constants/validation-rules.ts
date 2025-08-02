export const VALIDATION_RULES = {
  // Email validation
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  
  // Phone validation
  PHONE: {
    PATTERN: /^(\+251|0)?[79]\d{8}$/,
    MESSAGE: 'Please enter a valid Ethiopian phone number',
  },
  
  // Password validation
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MESSAGE: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character',
  },
  
  // Name validation
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s]+$/,
    MESSAGE: 'Name must contain only letters and spaces',
  },
  
  // Price validation
  PRICE: {
    MIN: 0,
    MAX: 1000000,
    MESSAGE: 'Price must be between 0 and 1,000,000',
  },
  
  // Quantity validation
  QUANTITY: {
    MIN: 0,
    MAX: 1000000,
    MESSAGE: 'Quantity must be between 0 and 1,000,000',
  },
  
  // Patient ID validation
  PATIENT_ID: {
    PATTERN: /^P\d{6}$/,
    MESSAGE: 'Patient ID must be in format P000000',
  },
} as const;

export const REQUIRED_FIELDS = {
  USER: ['email', 'firstName', 'lastName', 'role'],
  DRUG: ['name', 'category', 'price', 'stockQuantity', 'manufacturer'],
  PATIENT: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'address'],
  SALE: ['patientId', 'items', 'paymentMethod'],
  SERVICE: ['name', 'category', 'price', 'duration'],
  PAYMENT: ['patientId', 'amount', 'paymentMethod'],
} as const; 