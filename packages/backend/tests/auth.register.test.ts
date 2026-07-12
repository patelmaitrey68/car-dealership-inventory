import { describe, it, expect } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import User from '../src/models/User';

describe('User Registration Endpoint (POST /api/auth/register)', () => {
  it('should successfully register a new user, persist it, hash password, and return safe data with 210/201 status', async () => {
    const registrationPayload = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'password123',
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(registrationPayload);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(registrationPayload.name);
    expect(res.body.email).toBe(registrationPayload.email);
    expect(res.body.role).toBe('user');
    expect(res.body._id).toBeDefined();
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();

    // Verify DB persistence
    const savedUser = await User.findOne({ email: registrationPayload.email });
    expect(savedUser).not.toBeNull();
    expect(savedUser!.name).toBe(registrationPayload.name);
    expect(savedUser!.passwordHash).not.toBe(registrationPayload.password);
    
    // Verify bcrypt hashing format
    const isBcryptHash = savedUser!.passwordHash.startsWith('$2a$') || savedUser!.passwordHash.startsWith('$2b$');
    expect(isBcryptHash).toBe(true);
    
    const isPasswordValid = await bcrypt.compare(registrationPayload.password, savedUser!.passwordHash);
    expect(isPasswordValid).toBe(true);
  });

  it('should ignore role: "admin" inputs and default role to "user"', async () => {
    const maliciousPayload = {
      name: 'Malicious Admin',
      email: 'hacker@example.com',
      password: 'password123',
      role: 'admin',
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(maliciousPayload);

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('user');

    const savedUser = await User.findOne({ email: maliciousPayload.email });
    expect(savedUser!.role).toBe('user');
  });

  it('should return 409 Conflict if registering an already existing email', async () => {
    // Manually pre-populate one user
    await User.create({
      name: 'Existing User',
      email: 'existing@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
    });

    const duplicatePayload = {
      name: 'Another User',
      email: 'existing@example.com',
      password: 'password123',
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(duplicatePayload);

    expect(res.status).toBe(409);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 Bad Request if registration payload is missing a name', async () => {
    const payloadWithoutName = {
      email: 'noname@example.com',
      password: 'password123',
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(payloadWithoutName);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 Bad Request if registration payload email is invalid', async () => {
    const payloadInvalidEmail = {
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'password123',
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(payloadInvalidEmail);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 Bad Request if registration payload password is too short or missing', async () => {
    const payloadShortPassword = {
      name: 'Short Password',
      email: 'shortpass@example.com',
      password: '12',
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(payloadShortPassword);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });
});
