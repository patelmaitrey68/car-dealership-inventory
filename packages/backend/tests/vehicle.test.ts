import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Vehicle from '../src/models/Vehicle';

describe('Vehicle Model Schema Validation', () => {
  it('should successfully validate a correct vehicle payload', async () => {
    const validVehicle = new Vehicle({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: 5,
    });

    const err = validVehicle.validateSync();
    expect(err).toBeUndefined();
    expect(validVehicle._id).toBeDefined();
    expect(validVehicle.make).toBe('Toyota');
    expect(validVehicle.model).toBe('Camry');
    expect(validVehicle.category).toBe('Sedan');
    expect(validVehicle.price).toBe(25000);
    expect(validVehicle.quantity).toBe(5);
  });

  it('should require make', () => {
    const vehicle = new Vehicle({
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: 5,
    });
    const err = vehicle.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors.make).toBeDefined();
  });

  it('should require model', () => {
    const vehicle = new Vehicle({
      make: 'Toyota',
      category: 'Sedan',
      price: 25000,
      quantity: 5,
    });
    const err = vehicle.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors.model).toBeDefined();
  });

  it('should require category', () => {
    const vehicle = new Vehicle({
      make: 'Toyota',
      model: 'Camry',
      price: 25000,
      quantity: 5,
    });
    const err = vehicle.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors.category).toBeDefined();
  });

  it('should require price', () => {
    const vehicle = new Vehicle({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      quantity: 5,
    });
    const err = vehicle.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors.price).toBeDefined();
  });

  it('should reject a negative price', () => {
    const vehicle = new Vehicle({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: -100,
      quantity: 5,
    });
    const err = vehicle.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors.price).toBeDefined();
  });

  it('should require quantity', () => {
    const vehicle = new Vehicle({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
    });
    const err = vehicle.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors.quantity).toBeDefined();
  });

  it('should reject a negative quantity', () => {
    const vehicle = new Vehicle({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: -5,
    });
    const err = vehicle.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors.quantity).toBeDefined();
  });

  it('should reject a fractional/non-integer quantity', () => {
    const vehicle = new Vehicle({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: 2.5,
    });
    const err = vehicle.validateSync();
    expect(err).toBeDefined();
    expect(err!.errors.quantity).toBeDefined();
  });
});
