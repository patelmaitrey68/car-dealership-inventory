import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Vehicle, SearchFilters } from '../types';
import { getVehicles, searchVehicles, purchaseVehicle, deleteVehicle } from '../api/vehicles';
import { AddVehicleModal } from '../components/AddVehicleModal';
import { EditVehicleModal } from '../components/EditVehicleModal';
import { RestockModal } from '../components/RestockModal';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  // State variables
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Success feedback message state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Purchasing states map (id -> boolean) to track loading per vehicle card
  const [purchasingMap, setPurchasingMap] = useState<Record<string, boolean>>({});

  // Filter input states
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Admin Actions Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Fetch all vehicles on mount
  useEffect(() => {
    fetchInitialVehicles();
  }, []);

  const fetchInitialVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load vehicles from dealership database.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Perform backend search with active filters
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setFeedback(null);

    // Client side price validation
    const minVal = minPrice ? Number(minPrice) : NaN;
    const maxVal = maxPrice ? Number(maxPrice) : NaN;

    if (minPrice && (isNaN(minVal) || minVal < 0)) {
      setValidationError('Minimum price must be a non-negative number');
      return;
    }
    if (maxPrice && (isNaN(maxVal) || maxVal < 0)) {
      setValidationError('Maximum price must be a non-negative number');
      return;
    }
    if (minPrice && maxPrice && minVal > maxVal) {
      setValidationError('Minimum price cannot be greater than maximum price');
      return;
    }

    setLoading(true);
    setError(null);

    const filters: SearchFilters = {
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      category: category || undefined,
      minPrice: minPrice ? minVal : undefined,
      maxPrice: maxPrice ? maxVal : undefined,
    };

    try {
      const data = await searchVehicles(filters);
      setVehicles(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search request failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reset filters and fetch all vehicles
  const handleClearFilters = () => {
    setMake('');
    setModel('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setValidationError(null);
    setFeedback(null);
    fetchInitialVehicles();
  };

  // Trigger vehicle purchase
  const handlePurchase = async (id: string, vehicleMake: string, vehicleModel: string) => {
    setFeedback(null);
    
    // Set this card loading
    setPurchasingMap((prev) => ({ ...prev, [id]: true }));

    try {
      const updatedVehicle = await purchaseVehicle(id);
      
      // Update local vehicle quantity dynamically in state
      setVehicles((prev) =>
        prev.map((v) => (v._id === id ? { ...v, quantity: updatedVehicle.quantity } : v))
      );

      setFeedback({
        type: 'success',
        message: `Successfully purchased ${vehicleMake} ${vehicleModel}!`,
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Vehicle is out of stock (Conflict)
        setVehicles((prev) =>
          prev.map((v) => (v._id === id ? { ...v, quantity: 0 } : v))
        );
        setFeedback({
          type: 'error',
          message: 'This vehicle is currently out of stock.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.message || 'Failed to complete purchase. Please try again.',
        });
      }
    } finally {
      // Clear loading state for this card
      setPurchasingMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Trigger vehicle deletion
  const handleDelete = async (id: string, vehicleMake: string, vehicleModel: string) => {
    setFeedback(null);
    const confirm = window.confirm(`Are you sure you want to delete the ${vehicleMake} ${vehicleModel}?`);
    if (!confirm) return;

    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v._id !== id));
      setFeedback({
        type: 'success',
        message: `Successfully deleted ${vehicleMake} ${vehicleModel}!`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete vehicle.',
      });
    }
  };

  const handleAddSuccess = (newCar: Vehicle) => {
    setVehicles((prev) => [newCar, ...prev]);
    setFeedback({
      type: 'success',
      message: `Successfully added ${newCar.make} ${newCar.model}!`,
    });
  };

  const handleEditSuccess = (updatedCar: Vehicle) => {
    setVehicles((prev) => prev.map((v) => (v._id === updatedCar._id ? updatedCar : v)));
    setFeedback({
      type: 'success',
      message: `Successfully updated ${updatedCar.make} ${updatedCar.model}!`,
    });
  };

  const handleRestockSuccess = (updatedCar: Vehicle) => {
    setVehicles((prev) => prev.map((v) => (v._id === updatedCar._id ? updatedCar : v)));
    setFeedback({
      type: 'success',
      message: `Successfully restocked ${updatedCar.make} ${updatedCar.model} to ${updatedCar.quantity} units!`,
    });
  };

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="dashboard-title">Dealership Showroom</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Welcome back, <strong>{user?.name}</strong>. Browse and filter active vehicle inventory.
          </p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" style={{ maxWidth: '200px' }} onClick={() => setIsAddOpen(true)}>
            Add New Vehicle
          </button>
        )}
      </header>

      {/* Global Alerts & Feedback */}
      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'} data-testid="feedback-message">
          {feedback.message}
        </div>
      )}

      {/* Client-Side validation error */}
      {validationError && (
        <div className="alert-error" data-testid="validation-error">
          {validationError}
        </div>
      )}

      {/* Search and Filters panel */}
      <section className="filter-panel">
        <form onSubmit={handleSearch}>
          <div className="filter-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="make-filter">Make</label>
              <input
                id="make-filter"
                className="form-input"
                type="text"
                placeholder="e.g. Toyota"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="model-filter">Model</label>
              <input
                id="model-filter"
                className="form-input"
                type="text"
                placeholder="e.g. Camry"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="category-filter">Category</label>
              <select
                id="category-filter"
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Coupe">Coupe</option>
                <option value="Hatchback">Hatchback</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="min-price-filter">Min Price</label>
              <input
                id="min-price-filter"
                className="form-input"
                type="number"
                min="0"
                placeholder="Min ($)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="max-price-filter">Max Price</label>
              <input
                id="max-price-filter"
                className="form-input"
                type="number"
                min="0"
                placeholder="Max ($)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button
              type="button"
              className="btn btn-clear"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear
            </button>
            <button
              type="submit"
              className="btn btn-search"
              disabled={loading}
            >
              Apply Filters
            </button>
          </div>
        </form>
      </section>

      {/* Showroom Vehicle Grid */}
      {loading ? (
        <div className="state-container" data-testid="loading-state">
          <p className="state-title">Loading Showroom...</p>
          <p className="state-desc">Fetching vehicle listings from dealership server.</p>
        </div>
      ) : error ? (
        <div className="state-container" data-testid="error-state">
          <p className="state-title" style={{ color: 'var(--error)' }}>Error Loading Inventory</p>
          <p className="state-desc">{error}</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="state-container" data-testid="empty-state">
          <p className="state-title">No Vehicles Found</p>
          <p className="state-desc">No cars match your search filters. Try adjusting them or clear filters.</p>
        </div>
      ) : (
        <div className="vehicle-grid" data-testid="vehicle-grid">
          {vehicles.map((car) => {
            const isOut = car.quantity <= 0;
            const isBtnLoading = !!purchasingMap[car._id];
            
            return (
              <article className="vehicle-card" key={car._id}>
                <span className="vehicle-make">{car.make}</span>
                <h2 className="vehicle-model">{car.model}</h2>
                
                <div className="vehicle-details">
                  <span className="vehicle-category">{car.category}</span>
                  <span className="vehicle-price">{formatPrice(car.price)}</span>
                </div>
                
                <div className="vehicle-stock">
                  <span>Stock Available:</span>
                  <span className={`stock-status ${isOut ? 'out-of-stock' : 'in-stock'}`}>
                    <span className={`stock-dot ${isOut ? 'out-of-stock' : 'in-stock'}`}></span>
                    {isOut ? 'Out of Stock' : `${car.quantity} Units`}
                  </span>
                </div>
                
                <div className="vehicle-actions">
                  {user?.role === 'admin' ? (
                    <div className="admin-actions">
                      <button className="btn-admin" onClick={() => { setSelectedVehicle(car); setIsRestockOpen(true); }}>
                        Restock
                      </button>
                      <button className="btn-admin" onClick={() => { setSelectedVehicle(car); setIsEditOpen(true); }}>
                        Edit
                      </button>
                      <button className="btn-admin btn-admin-danger" onClick={() => handleDelete(car._id, car.make, car.model)}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn"
                      style={{ backgroundColor: isOut ? 'var(--border)' : 'var(--primary)' }}
                      onClick={() => handlePurchase(car._id, car.make, car.model)}
                      disabled={isOut || isBtnLoading}
                    >
                      {isOut ? 'Out of Stock' : isBtnLoading ? 'Purchasing...' : 'Purchase'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Admin Modals */}
      <AddVehicleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAddSuccess}
      />
      
      <EditVehicleModal
        isOpen={isEditOpen}
        vehicle={selectedVehicle}
        onClose={() => { setIsEditOpen(false); setSelectedVehicle(null); }}
        onSuccess={handleEditSuccess}
      />

      <RestockModal
        isOpen={isRestockOpen}
        vehicle={selectedVehicle}
        onClose={() => { setIsRestockOpen(false); setSelectedVehicle(null); }}
        onSuccess={handleRestockSuccess}
      />
    </div>
  );
};

export default HomePage;
