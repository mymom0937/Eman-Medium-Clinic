import dbConnect from './connection';
import { databaseService } from '../config/database';

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test the connection
    await dbConnect();
    console.log('✅ Database connection successful!');
    
    // Test the database service
    const isConnected = databaseService.isConnected();
    console.log('✅ Database service connection status:', isConnected);
    
    // Get database stats
    const stats = await databaseService.getStats();
    console.log('📊 Database stats:', stats);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

/**
 * Test model registration
 */
export async function testModelRegistration() {
  try {
    console.log('🔍 Testing model registration...');
    
    // Import all models to ensure they're registered
    const { User, Drug, Patient, Sale, Payment, Service, ServiceBooking } = await import('./models');
    
    console.log('✅ All models registered successfully!');
    console.log('📋 Registered models:');
    console.log('  - User:', User.modelName);
    console.log('  - Drug:', Drug.modelName);
    console.log('  - Patient:', Patient.modelName);
    console.log('  - Sale:', Sale.modelName);
    console.log('  - Payment:', Payment.modelName);
    console.log('  - Service:', Service.modelName);
    console.log('  - ServiceBooking:', ServiceBooking.modelName);
    
    return true;
  } catch (error) {
    console.error('❌ Model registration test failed:', error);
    return false;
  }
} 