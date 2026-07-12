import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import Vehicle from '../src/models/Vehicle';

const secret = process.env.JWT_SECRET || 'localdevsecretkeyfordealership';

describe('Vehicle CRUD API Endpoint (POST, GET, PUT, DELETE /api/vehicles)', () => {
  let userToken: string;
  let adminToken: string;
  let sampleVehicle: any;

  beforeEach(async () => {
    // Generate valid tokens
    userToken = jwt.sign({ id: 'user123', role: 'user' }, secret);
    adminToken = jwt.sign({ id: 'admin123', role: 'admin' }, secret);

    // Seed one vehicle
    sampleVehicle = await Vehicle.create({
      make: 'Honda',
      model: 'Civic',
      category: 'Sedan',
      price: 22000,
      quantity: 10,
    });
  });

  describe('POST /api/vehicles', () => {
    it('should successfully add a valid vehicle when authenticated', async () => {
      const payload = {
        make: 'Ford',
        model: 'Mustang',
        category: 'Sports',
        price: 36000,
        quantity: 3,
      };

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.make).toBe(payload.make);
      expect(res.body.model).toBe(payload.model);
      expect(res.body.category).toBe(payload.category);
      expect(res.body.price).toBe(payload.price);
      expect(res.body.quantity).toBe(payload.quantity);

      // Verify db persistence
      const persisted = await Vehicle.findById(res.body._id);
      expect(persisted).not.toBeNull();
      expect(persisted!.make).toBe(payload.make);
    });

    it('should reject unauthenticated post with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .send({
          make: 'Ford',
          model: 'Mustang',
          category: 'Sports',
          price: 36000,
          quantity: 3,
        });

      expect(res.status).toBe(401);
    });

    it('should reject invalid payload with 400 Bad Request', async () => {
      const invalidPayload = {
        make: 'Ford',
        category: 'Sports',
        price: -100,
        quantity: 3.5,
      };

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('GET /api/vehicles', () => {
    it('should list all vehicles when authenticated', async () => {
      const res = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(String(sampleVehicle._id));
    });

    it('should return 200 and empty array when no vehicles exist', async () => {
      // Clear vehicles first
      await Vehicle.deleteMany({});

      const res = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/vehicles');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('should update an existing vehicle when authenticated', async () => {
      const updatePayload = {
        price: 24000,
        quantity: 12,
      };

      const res = await request(app)
        .put(`/api/vehicles/${sampleVehicle._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(updatePayload.price);
      expect(res.body.quantity).toBe(updatePayload.quantity);

      // Verify db persistence
      const persisted = await Vehicle.findById(sampleVehicle._id);
      expect(persisted!.price).toBe(updatePayload.price);
      expect(persisted!.quantity).toBe(updatePayload.quantity);
    });

    it('should reject invalid update payload with 400 Bad Request', async () => {
      const res = await request(app)
        .put(`/api/vehicles/${sampleVehicle._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ price: -50 });

      expect(res.status).toBe(400);
    });

    it('should return 404 for a nonexistent valid MongoDB ObjectId', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/vehicles/${randomId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ price: 23000 });

      expect(res.status).toBe(404);
    });

    it('should return 400 for a malformed ID', async () => {
      const res = await request(app)
        .put('/api/vehicles/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ price: 23000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should reject unauthenticated update with 401 Unauthorized', async () => {
      const res = await request(app)
        .put(`/api/vehicles/${sampleVehicle._id}`)
        .send({ price: 23000 });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('should allow admin to delete an existing vehicle', async () => {
      const res = await request(app)
        .delete(`/api/vehicles/${sampleVehicle._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();

      const persisted = await Vehicle.findById(sampleVehicle._id);
      expect(persisted).toBeNull();
    });

    it('should reject normal user from deleting with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/vehicles/${sampleVehicle._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBeDefined();
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).delete(`/api/vehicles/${sampleVehicle._id}`);
      expect(res.status).toBe(401);
    });

    it('should return 404 for a nonexistent valid MongoDB ObjectId', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/vehicles/${randomId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for a malformed ID', async () => {
      const res = await request(app)
        .delete('/api/vehicles/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });
});
