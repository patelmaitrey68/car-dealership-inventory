import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import Vehicle from '../src/models/Vehicle';

const secret = process.env.JWT_SECRET || 'localdevsecretkeyfordealership';

describe('Vehicle Inventory API Endpoints (Purchase & Restock)', () => {
  let userToken: string;
  let adminToken: string;
  let sampleVehicle: any;

  beforeEach(async () => {
    userToken = jwt.sign({ id: 'user123', role: 'user' }, secret);
    adminToken = jwt.sign({ id: 'admin123', role: 'admin' }, secret);

    sampleVehicle = await Vehicle.create({
      make: 'Mazda',
      model: '3',
      category: 'Sedan',
      price: 21000,
      quantity: 5,
    });
  });

  describe('POST /api/vehicles/:id/purchase — PURCHASE VEHICLE', () => {
    it('should successfully purchase a vehicle, decrementing quantity by 1 with status 200', async () => {
      const res = await request(app)
        .post(`/api/vehicles/${sampleVehicle._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(4);

      const persisted = await Vehicle.findById(sampleVehicle._id);
      expect(persisted!.quantity).toBe(4);
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).post(`/api/vehicles/${sampleVehicle._id}/purchase`);
      expect(res.status).toBe(401);
    });

    it('should return 409 Conflict if vehicle quantity is zero', async () => {
      // Set quantity to 0
      sampleVehicle.quantity = 0;
      await sampleVehicle.save();

      const res = await request(app)
        .post(`/api/vehicles/${sampleVehicle._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toBeDefined();

      const persisted = await Vehicle.findById(sampleVehicle._id);
      expect(persisted!.quantity).toBe(0);
    });

    it('should return 404 Not Found for a nonexistent valid MongoDB ObjectId', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/vehicles/${randomId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 Bad Request for a malformed vehicle ID', async () => {
      const res = await request(app)
        .post('/api/vehicles/invalid-id/purchase')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should handle concurrent purchase requests safely and prevent overselling', async () => {
      // Create vehicle with quantity 1
      const v = await Vehicle.create({
        make: 'Honda',
        model: 'Accord',
        category: 'Sedan',
        price: 28000,
        quantity: 1,
      });

      // Send 2 concurrent purchase requests
      const promises = [
        request(app).post(`/api/vehicles/${v._id}/purchase`).set('Authorization', `Bearer ${userToken}`),
        request(app).post(`/api/vehicles/${v._id}/purchase`).set('Authorization', `Bearer ${userToken}`),
      ];

      const responses = await Promise.all(promises);
      const statuses = responses.map((r) => r.status);

      expect(statuses).toContain(200);
      expect(statuses).toContain(409);

      const finalVehicle = await Vehicle.findById(v._id);
      expect(finalVehicle!.quantity).toBe(0);
    });
  });

  describe('POST /api/vehicles/:id/restock — RESTOCK VEHICLE', () => {
    it('should allow admin to restock and increase quantity by requested positive integer', async () => {
      const res = await request(app)
        .post(`/api/vehicles/${sampleVehicle._id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 10 });

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(15);

      const persisted = await Vehicle.findById(sampleVehicle._id);
      expect(persisted!.quantity).toBe(15);
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app)
        .post(`/api/vehicles/${sampleVehicle._id}/restock`)
        .send({ quantity: 5 });

      expect(res.status).toBe(401);
    });

    it('should reject normal authenticated user with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/vehicles/${sampleVehicle._id}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(403);
    });

    it('should return 400 Bad Request if restock quantity is missing, zero, negative, fractional, or nonnumeric', async () => {
      const badInputs = [
        {},
        { quantity: 0 },
        { quantity: -5 },
        { quantity: 2.5 },
        { quantity: 'invalid' },
      ];

      for (const payload of badInputs) {
        const res = await request(app)
          .post(`/api/vehicles/${sampleVehicle._id}/restock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();
      }
    });

    it('should return 404 Not Found for a nonexistent valid MongoDB ObjectId', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/vehicles/${randomId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(404);
    });

    it('should return 400 Bad Request for a malformed ID', async () => {
      const res = await request(app)
        .post('/api/vehicles/invalid-id/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });
});
