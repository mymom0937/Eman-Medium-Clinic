import { Types } from 'mongoose';

/**
 * Generate a unique ID for documents
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${randomStr}`.toUpperCase();
}

/**
 * Generate patient ID (P001, P002, etc.)
 */
export async function generatePatientId(): Promise<string> {
  // This will be implemented in the Patient model
  return 'P001'; // Placeholder
}

/**
 * Generate sale ID (S001, S002, etc.)
 */
export async function generateSaleId(): Promise<string> {
  // This will be implemented in the Sale model
  return 'S001'; // Placeholder
}

/**
 * Generate payment ID (PAY001, PAY002, etc.)
 */
export async function generatePaymentId(): Promise<string> {
  // This will be implemented in the Payment model
  return 'PAY001'; // Placeholder
}

/**
 * Generate booking ID (B001, B002, etc.)
 */
export async function generateBookingId(): Promise<string> {
  // This will be implemented in the ServiceBooking model
  return 'B001'; // Placeholder
}

/**
 * Generate a unique lab result ID
 * @returns A unique lab result ID in format LAB000001
 */
export async function generateLabResultId(): Promise<string> {
  try {
    const { connectToDatabase } = await import('@/config/database');
    const { LabResult } = await import('@/models/lab-result');
    
    await connectToDatabase();
    
    // Get the latest lab result to determine the next ID
    const latestLabResult = await LabResult.findOne().sort({ labResultId: -1 });
    
    let nextNumber = 1;
    if (latestLabResult && latestLabResult.labResultId) {
      const lastNumber = parseInt(latestLabResult.labResultId.replace('LAB', ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    // Format the ID with leading zeros (6 digits)
    const formattedNumber = nextNumber.toString().padStart(6, '0');
    return `LAB${formattedNumber}`;
  } catch (error) {
    console.error('Error generating lab result ID:', error);
    // Fallback: generate based on timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `LAB${timestamp}`;
  }
}

/**
 * Convert string to ObjectId
 */
export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/**
 * Check if string is valid ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
} 