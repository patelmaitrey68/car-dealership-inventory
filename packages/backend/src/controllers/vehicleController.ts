import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle';

export async function createVehicle(req: Request, res: Response): Promise<void> {
  try {
    const { make, model, category, price, quantity } = req.body;

    const newVehicle = new Vehicle({
      make,
      model,
      category,
      price,
      quantity,
    });

    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getVehicles(req: Request, res: Response): Promise<void> {
  try {
    const vehicles = await Vehicle.find({});
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateVehicle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid vehicle ID format' });
      return;
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedVehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    res.status(200).json(updatedVehicle);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteVehicle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid vehicle ID format' });
      return;
    }

    const deletedVehicle = await Vehicle.findByIdAndDelete(id);

    if (!deletedVehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
