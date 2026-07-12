import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { restockVehicle } from '../api/vehicles';

interface RestockModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: (updatedVehicle: Vehicle) => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  vehicle,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity) {
      setError('Please specify quantity.');
      return;
    }

    const qtyNum = Number(quantity);

    if (isNaN(qtyNum) || qtyNum <= 0 || !Number.isInteger(qtyNum)) {
      setError('Restock quantity must be a positive integer.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updated = await restockVehicle(vehicle._id, qtyNum);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to restock vehicle.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Restock Inventory</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)' }}>
          Specify the quantity to add to the current stock for <strong>{vehicle.make} {vehicle.model}</strong>.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="restock-qty">Restock Quantity</label>
            <input
              id="restock-qty"
              className="form-input"
              type="number"
              min="1"
              step="1"
              placeholder="Quantity to add (e.g. 10)"
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
              {loading ? 'Restocking...' : 'Submit Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
