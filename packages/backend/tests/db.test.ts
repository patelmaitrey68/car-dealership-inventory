import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateDatabaseConfig } from '../src/config/db';

describe('Database Configuration Security Checks', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should throw an error in test mode if MONGODB_TEST_URI is missing', () => {
    delete process.env.MONGODB_TEST_URI;
    expect(() => validateDatabaseConfig('test')).toThrow(
      'Database Security Error: MONGODB_TEST_URI is mandatory when NODE_ENV=test.'
    );
  });

  it('should throw an error in test mode if MONGODB_TEST_URI is identical to MONGODB_URI', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/car-dealership';
    process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/car-dealership';
    expect(() => validateDatabaseConfig('test')).toThrow(
      'Database Security Error: MONGODB_TEST_URI cannot be identical to MONGODB_URI.'
    );
  });

  it('should throw an error in test mode if MONGODB_TEST_URI does not contain "test" in its database name', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/car-dealership';
    process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/prod_like_db';
    expect(() => validateDatabaseConfig('test')).toThrow(
      'Database Security Error: MONGODB_TEST_URI database name "prod_like_db" must contain "test".'
    );
  });

  it('should return test URI if database configuration passes safety checks', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/car-dealership';
    process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/car-dealership-test';
    const uri = validateDatabaseConfig('test');
    expect(uri).toBe('mongodb://localhost:27017/car-dealership-test');
  });

  it('should throw an error in dev mode if MONGODB_URI is missing', () => {
    delete process.env.MONGODB_URI;
    expect(() => validateDatabaseConfig('development')).toThrow(
      'Database Configuration Error: MONGODB_URI is required for development/production.'
    );
  });

  it('should return dev URI in dev mode', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/car-dealership';
    const uri = validateDatabaseConfig('development');
    expect(uri).toBe('mongodb://localhost:27017/car-dealership');
  });
});
