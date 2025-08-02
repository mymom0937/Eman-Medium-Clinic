import { VALIDATION_RULES } from '@/constants/validation-rules';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateEmail(email: string): boolean {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email);
}

export function validatePhone(phone: string): boolean {
  return VALIDATION_RULES.PHONE.PATTERN.test(phone);
}

export function validatePassword(password: string): boolean {
  return (
    password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH &&
    VALIDATION_RULES.PASSWORD.PATTERN.test(password)
  );
}

export function validateName(name: string): boolean {
  return (
    name.length >= VALIDATION_RULES.NAME.MIN_LENGTH &&
    name.length <= VALIDATION_RULES.NAME.MAX_LENGTH &&
    VALIDATION_RULES.NAME.PATTERN.test(name)
  );
}

export function validatePrice(price: number): boolean {
  return price >= VALIDATION_RULES.PRICE.MIN && price <= VALIDATION_RULES.PRICE.MAX;
}

export function validateQuantity(quantity: number): boolean {
  return quantity >= VALIDATION_RULES.QUANTITY.MIN && quantity <= VALIDATION_RULES.QUANTITY.MAX;
}

export function validatePatientId(id: string): boolean {
  return VALIDATION_RULES.PATIENT_ID.PATTERN.test(id);
}

export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
    };
  }
  return null;
}

export function validateForm(data: Record<string, any>, rules: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Check required
    if (rule.required && !validateRequired(value, field)) {
      errors.push({
        field,
        message: rule.requiredMessage || `${field} is required`,
      });
      continue;
    }

    // Skip validation if value is empty and not required
    if (!value) continue;

    // Check min length
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      errors.push({
        field,
        message: rule.minLengthMessage || `${field} must be at least ${rule.minLength} characters`,
      });
    }

    // Check max length
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      errors.push({
        field,
        message: rule.maxLengthMessage || `${field} must be at most ${rule.maxLength} characters`,
      });
    }

    // Check pattern
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({
        field,
        message: rule.patternMessage || `${field} format is invalid`,
      });
    }

    // Check min value
    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      errors.push({
        field,
        message: rule.minMessage || `${field} must be at least ${rule.min}`,
      });
    }

    // Check max value
    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
      errors.push({
        field,
        message: rule.maxMessage || `${field} must be at most ${rule.max}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  const error = errors.find(error => error.field === fieldName);
  return error?.message;
} 