import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import User from '../src/models/User';

describe('User Login Endpoint (POST /api/auth/login)', () => {
  const testPassword = 'password123';
  let testUser: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    testUser = await User.create({
      name: 'Bob Jones',
      email: 'bob@example.com',
      passwordHash,
      role: 'user',
    });
  });

  it('should successfully log in, return a non-empty JWT token, and safe user details with 200 status', async () => {
    const loginPayload = {
      email: 'bob@example.com',
      password: testPassword,
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginPayload);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user._id).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.passwordHash).toBeUndefined();

    // Verify JWT Claims
    const secret = process.env.JWT_SECRET || 'localdevsecretkeyfordealership';
    const decoded: any = jwt.verify(res.body.token, secret);
    expect(decoded.id).toBe(String(testUser._id));
    expect(decoded.role).toBe('user');
  });

  it('should support email case normalization during login', async () => {
    const loginPayload = {
      email: 'BOB@EXAMPLE.COM',
      password: testPassword,
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginPayload);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should reject incorrect password with 401 Unauthorized', async () => {
    const loginPayload = {
      email: 'bob@example.com',
      password: 'wrongpassword',
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginPayload);

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
    expect(res.body.message).toBeDefined();
  });

  it('should reject nonexistent user with 401 Unauthorized using a generic message', async () => {
    const loginPayload = {
      email: 'nonexistent@example.com',
      password: testPassword,
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(loginPayload);

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 Bad Request if missing email or password', async () => {
    const incompletePayload = {
      email: 'bob@example.com',
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(incompletePayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 Bad Request if email format is invalid', async () => {
    const invalidEmailPayload = {
      email: 'bob-at-example.com',
      password: testPassword,
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(invalidEmailPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });
});
