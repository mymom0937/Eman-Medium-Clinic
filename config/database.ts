import mongoose from 'mongoose';

export interface DatabaseConfig {
  uri: string;
  dbName: string;
  options: {
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    bufferMaxEntries: number;
  };
}

export class DatabaseService {
  private static instance: DatabaseService;
  private config: DatabaseConfig;

  private constructor() {
    this.config = {
      uri: process.env.MONGODB_URL || 'mongodb://localhost:27017',
      dbName: process.env.MONGODB_DB_NAME || 'eman_clinic',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
      },
    };
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to MongoDB using Mongoose
   */
  public async connect(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        // console.log('✅ Already connected to MongoDB');
        return;
      }

      await mongoose.connect(this.config.uri, {
        dbName: this.config.dbName,
        maxPoolSize: this.config.options.maxPoolSize,
        serverSelectionTimeoutMS: this.config.options.serverSelectionTimeoutMS,
        socketTimeoutMS: this.config.options.socketTimeoutMS,
        bufferCommands: false,
      });
      
      // console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Get Mongoose connection
   */
  public getConnection(): typeof mongoose {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return mongoose;
  }

  /**
   * Close database connection
   */
  public async disconnect(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        // console.log('✅ Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Get database configuration
   */
  public getConfig(): DatabaseConfig {
    return this.config;
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        await this.connect();
      }
      
      // Ping the database
      const db = mongoose.connection.db;
      if (db) {
        await db.admin().ping();
        // console.log('✅ Database connection test successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<any> {
    try {
      if (!this.isConnected()) {
        throw new Error('Database not connected');
      }

      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      // Get basic database info
      const collections = await db.listCollections().toArray();
      return {
        database: this.config.dbName,
        collections: collections.length,
        connectionState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for better performance
   */
  public async createIndexes(): Promise<void> {
    try {
      if (!this.isConnected()) {
        throw new Error('Database not connected');
      }

      // Import models to ensure they're registered
      await import('../models');

      // console.log('✅ Database indexes will be created automatically by Mongoose schemas');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

// Export convenience functions
export async function connectToDatabase(): Promise<void> {
  return databaseService.connect();
}

export async function disconnectFromDatabase(): Promise<void> {
  return databaseService.disconnect();
}

export function getDatabase(): typeof mongoose {
  return databaseService.getConnection();
}

export function isDatabaseConnected(): boolean {
  return databaseService.isConnected();
} 