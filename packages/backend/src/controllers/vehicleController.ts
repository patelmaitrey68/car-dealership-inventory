import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle';

const escapeRegex = (s: string) => s.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');

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

export async function searchVehicles(req: Request, res: Response): Promise<void> {
  try {
    const { make, model, category, minPrice, maxPrice } = req.query;
    const query: any = {};

    let minPriceNum: number | undefined;
    let maxPriceNum: number | undefined;

    if (minPrice !== undefined) {
      minPriceNum = Number(minPrice);
      if (isNaN(minPriceNum) || minPriceNum < 0) {
        res.status(400).json({ message: 'minPrice must be a non-negative number' });
        return;
      }
    }

    if (maxPrice !== undefined) {
      maxPriceNum = Number(maxPrice);
      if (isNaN(maxPriceNum) || maxPriceNum < 0) {
        res.status(400).json({ message: 'maxPrice must be a non-negative number' });
        return;
      }
    }

    if (minPriceNum !== undefined && maxPriceNum !== undefined && minPriceNum > maxPriceNum) {
      res.status(400).json({ message: 'minPrice cannot be greater than maxPrice' });
      return;
    }

    if (make && typeof make === 'string') {
      query.make = { $regex: new RegExp('^' + escapeRegex(make) + '$', 'i') };
    }

    if (model && typeof model === 'string') {
      query.model = { $regex: new RegExp('^' + escapeRegex(model) + '$', 'i') };
    }

    if (category && typeof category === 'string') {
      query.category = { $regex: new RegExp('^' + escapeRegex(category) + '$', 'i') };
    }

    if (minPriceNum !== undefined || maxPriceNum !== undefined) {
      query.price = {};
      if (minPriceNum !== undefined) {
        query.price.$gte = minPriceNum;
      }
      if (maxPriceNum !== undefined) {
        query.price.$lte = maxPriceNum;
      }
    }

    const results = await Vehicle.find(query);
    res.status(200).json(results);
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
