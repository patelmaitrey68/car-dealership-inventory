import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db';

beforeAll(async () => {
  // Set NODE_ENV to test to trigger safety checks
  process.env.NODE_ENV = 'test';
  
  // This will connect and automatically throw if the safety checks fail
  await connectDB();
});

beforeEach(async () => {
  // Safe cleanup: Clear database collections before each test run
  // Only runs on the verified test database
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await disconnectDB();
});
