import { Schema, model } from 'mongoose';

export interface IVehicle {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    make: {
      type: String,
      required: [true, 'Make is required'],
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = model<IVehicle>('Vehicle', VehicleSchema);

export default Vehicle;
