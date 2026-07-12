import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { updateVehicle } from '../api/vehicles';

interface EditVehicleModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: (updatedVehicle: Vehicle) => void;
}

export const EditVehicleModal: React.FC<EditVehicleModalProps> = ({
  isOpen,
  vehicle,
  onClose,
  onSuccess,
}) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('Sedan');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setCategory(vehicle.category);
      setPrice(String(vehicle.price));
      setQuantity(String(vehicle.quantity));
      setError(null);
    }
  }, [vehicle, isOpen]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !category.trim() || !price || !quantity) {
      setError('Please fill in all fields.');
      return;
    }

    const priceNum = Number(price);
    const qtyNum = Number(quantity);

    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a non-negative number.');
      return;
    }

    if (isNaN(qtyNum) || qtyNum < 0 || !Number.isInteger(qtyNum)) {
      setError('Quantity must be a non-negative integer.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updated = await updateVehicle(vehicle._id, {
        make: make.trim(),
        model: model.trim(),
        category,
        price: priceNum,
        quantity: qtyNum,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update vehicle.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Vehicle</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-make">Make</label>
            <input
              id="edit-make"
              className="form-input"
              type="text"
              placeholder="e.g. Toyota"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-model">Model</label>
            <input
              id="edit-model"
              className="form-input"
              type="text"
              placeholder="e.g. Camry"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-category">Category</label>
            <select
              id="edit-category"
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              required
            >
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Truck">Truck</option>
              <option value="Coupe">Coupe</option>
              <option value="Hatchback">Hatchback</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-price">Price ($)</label>
            <input
              id="edit-price"
              className="form-input"
              type="number"
              min="0"
              placeholder="e.g. 25000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-quantity">Quantity in Stock</label>
            <input
              id="edit-quantity"
              className="form-input"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="modal-footer">
            <button className="btn btn-clear" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
