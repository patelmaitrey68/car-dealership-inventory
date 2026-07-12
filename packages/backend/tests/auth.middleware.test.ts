import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateUser, requireAdmin } from '../src/middleware/auth';

const secret = process.env.JWT_SECRET || 'localdevsecretkeyfordealership';

// Create a test-only express app inside the test file to test middleware in isolation
const testApp = express();
testApp.use(express.json());

// A protected mock route
testApp.get('/protected', authenticateUser, (req: any, res: any) => {
  res.status(200).json({ user: req.user });
});

// An admin-only mock route
testApp.get('/admin-only', authenticateUser, requireAdmin, (req: any, res: any) => {
  res.status(200).json({ message: 'Success' });
});

describe('Authentication & Authorization Middlewares', () => {
  it('should reject request with 401 Unauthorized if Authorization header is missing', async () => {
    const res = await request(testApp).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  it('should reject request with 401 Unauthorized if scheme is not Bearer', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  it('should reject request with 401 Unauthorized if token is empty', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  it('should reject request with 401 Unauthorized if token is invalid or tampered', async () => {
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer invalidtokenhere');
    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  it('should allow request with valid user token and propagate user payload to req.user', async () => {
    const token = jwt.sign({ id: 'user123', role: 'user' }, secret);
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe('user123');
    expect(res.body.user.role).toBe('user');
  });

  it('should allow request with valid admin token and propagate admin payload', async () => {
    const token = jwt.sign({ id: 'admin123', role: 'admin' }, secret);
    const res = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe('admin123');
    expect(res.body.user.role).toBe('admin');
  });

  it('should reject normal user accessing admin-only route with 403 Forbidden', async () => {
    const token = jwt.sign({ id: 'user123', role: 'user' }, secret);
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(403);
    expect(res.body.message).toBeDefined();
  });

  it('should allow admin accessing admin-only route with 200 OK', async () => {
    const token = jwt.sign({ id: 'admin123', role: 'admin' }, secret);
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Success');
  });
});
