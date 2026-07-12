import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import Vehicle from '../src/models/Vehicle';

const secret = process.env.JWT_SECRET || 'localdevsecretkeyfordealership';

describe('Vehicle Search API Endpoint (GET /api/vehicles/search)', () => {
  let userToken: string;
  let toyotaCamry: any;
  let toyotaRav4: any;
  let hondaCivic: any;
  let fordF150: any;

  beforeEach(async () => {
    userToken = jwt.sign({ id: 'user123', role: 'user' }, secret);

    // Seed deterministic set of vehicles
    toyotaCamry = await Vehicle.create({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: 5,
    });

    toyotaRav4 = await Vehicle.create({
      make: 'Toyota',
      model: 'RAV4',
      category: 'SUV',
      price: 30000,
      quantity: 3,
    });

    hondaCivic = await Vehicle.create({
      make: 'Honda',
      model: 'Civic',
      category: 'Sedan',
      price: 22000,
      quantity: 10,
    });

    fordF150 = await Vehicle.create({
      make: 'Ford',
      model: 'F-150',
      category: 'Truck',
      price: 45000,
      quantity: 2,
    });
  });

  it('should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/vehicles/search');
    expect(res.status).toBe(401);
  });

  it('should search by make case-insensitively', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=toyota')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const makes = res.body.map((v: any) => v.make);
    expect(makes).toContain('Toyota');
    expect(makes).not.toContain('Honda');
    expect(makes).not.toContain('Ford');
  });

  it('should search by model case-insensitively', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?model=CAMRY')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].model).toBe('Camry');
  });

  it('should search by category case-insensitively', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?category=suv')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].category).toBe('SUV');
  });

  it('should filter by minPrice inclusively', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=25000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    const prices = res.body.map((v: any) => v.price);
    expect(prices).toContain(25000);
    expect(prices).toContain(30000);
    expect(prices).toContain(45000);
    expect(prices).not.toContain(22000);
  });

  it('should filter by maxPrice inclusively', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?maxPrice=30000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    const prices = res.body.map((v: any) => v.price);
    expect(prices).toContain(22000);
    expect(prices).toContain(25000);
    expect(prices).toContain(30000);
    expect(prices).not.toContain(45000);
  });

  it('should filter by combined price range inclusively', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=23000&maxPrice=35000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const prices = res.body.map((v: any) => v.price);
    expect(prices).toContain(25000);
    expect(prices).toContain(30000);
  });

  it('should filter by combined criteria using AND semantics', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=Toyota&category=Sedan&minPrice=20000&maxPrice=30000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toBe(String(toyotaCamry._id));
  });

  it('should return 200 and empty array if no vehicles match', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?make=Ferrari')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('should return 200 and all vehicles if no query filters are provided', async () => {
    const res = await request(app)
      .get('/api/vehicles/search')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);
  });

  it('should reject non-numeric minPrice with 400 Bad Request', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=abc')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should reject non-numeric maxPrice with 400 Bad Request', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?maxPrice=xyz')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should reject negative minPrice or maxPrice with 400 Bad Request', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=-10')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('should reject if minPrice is greater than maxPrice with 400 Bad Request', async () => {
    const res = await request(app)
      .get('/api/vehicles/search?minPrice=30000&maxPrice=20000')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });
});
