import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export function validateDatabaseConfig(nodeEnv: string | undefined): string {
  const isTest = nodeEnv === 'test';

  if (isTest) {
    const testUri = process.env.MONGODB_TEST_URI;
    if (!testUri) {
      throw new Error('Database Security Error: MONGODB_TEST_URI is mandatory when NODE_ENV=test.');
    }

    const devUri = process.env.MONGODB_URI;
    if (devUri && testUri === devUri) {
      throw new Error('Database Security Error: MONGODB_TEST_URI cannot be identical to MONGODB_URI.');
    }

    // Verify database name contains "test"
    // Handles URIs like mongodb://localhost:27017/dbname-test or mongodb+srv://.../dbname-test?auth...
    const urlPath = testUri.split('?')[0]; // strip query parameters
    const dbName = urlPath.substring(urlPath.lastIndexOf('/') + 1);
    if (!dbName.toLowerCase().includes('test')) {
      throw new Error(`Database Security Error: MONGODB_TEST_URI database name "${dbName}" must contain "test".`);
    }

    return testUri;
  } else {
    const devUri = process.env.MONGODB_URI;
    if (!devUri) {
      throw new Error('Database Configuration Error: MONGODB_URI is required for development/production.');
    }
    return devUri;
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = validateDatabaseConfig(process.env.NODE_ENV);
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
