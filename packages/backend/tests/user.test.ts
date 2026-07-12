import { describe, it, expect } from 'vitest';
import User from '../src/models/User';

describe('User Model Validations', () => {
  it('should instantiate a valid user document with name, email, and passwordHash', () => {
    const validUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123',
    };
    const user = new User(validUserData);
    expect(user.name).toBe(validUserData.name);
    expect(user.email).toBe(validUserData.email);
    expect(user.passwordHash).toBe(validUserData.passwordHash);
    expect(user.role).toBe('user'); // Default role
    expect(user._id).toBeDefined();
  });

  it('should accept role "admin"', () => {
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: 'hashedpassword123',
      role: 'admin',
    });
    expect(adminUser.role).toBe('admin');
  });

  it('should reject invalid role values', () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashedpassword123',
      role: 'invalid_role',
    });
    const err = user.validateSync();
    expect(err?.errors['role']).toBeDefined();
  });

  it('should require a name field', () => {
    const user = new User({
      email: 'john@example.com',
      passwordHash: 'hashedpassword123',
    });
    const err = user.validateSync();
    expect(err?.errors['name']).toBeDefined();
  });

  it('should require an email field', () => {
    const user = new User({
      name: 'John Doe',
      passwordHash: 'hashedpassword123',
    });
    const err = user.validateSync();
    expect(err?.errors['email']).toBeDefined();
  });

  it('should require a passwordHash field', () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
    });
    const err = user.validateSync();
    expect(err?.errors['passwordHash']).toBeDefined();
  });
});
