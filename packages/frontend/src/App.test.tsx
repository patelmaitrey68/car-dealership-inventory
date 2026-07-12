// A robust localStorage mock defined at the very top of the file
const storeMock: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storeMock[key] || null,
  setItem: (key: string, value: string) => {
    storeMock[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete storeMock[key];
  },
  clear: () => {
    for (const key in storeMock) {
      delete storeMock[key];
    }
  },
  length: 0,
  key: () => null,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  enumerable: true,
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  enumerable: true,
  writable: true,
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import client from './api/client';
import { getVehicles, searchVehicles, purchaseVehicle, addVehicle, updateVehicle, deleteVehicle, restockVehicle } from './api/vehicles';

// Mock the API client and vehicles helper
vi.mock('./api/client', () => {
  return {
    default: {
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
      },
    },
  };
});

vi.mock('./api/vehicles', () => {
  return {
    getVehicles: vi.fn(),
    searchVehicles: vi.fn(),
    purchaseVehicle: vi.fn(),
    addVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    deleteVehicle: vi.fn(),
    restockVehicle: vi.fn(),
  };
});

describe('Frontend SPA Authentication Flow', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to the login page', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('name@dealership.com')).toBeInTheDocument();
    });
  });

  it('logs in successfully and persists token and user data', async () => {
    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@dealership.com',
      role: 'user',
    };
    const mockToken = 'mocked-jwt-token';

    (client.post as any).mockResolvedValue({
      data: {
        token: mockToken,
        user: mockUser,
      },
    });

    (getVehicles as any).mockResolvedValue([]);

    render(<App />);

    const emailInput = screen.getByPlaceholderText('name@dealership.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });

    await userEvent.type(emailInput, 'john@dealership.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(JSON.parse(localStorage.getItem('user') || '')).toEqual(mockUser);
    });

    expect(screen.getByText('Dealership Showroom')).toBeInTheDocument();
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
  });

  it('clears token and user data on logout and redirects to login', async () => {
    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'john@dealership.com',
      role: 'user',
    };
    const mockToken = 'mocked-jwt-token';
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    (getVehicles as any).mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dealership Showroom')).toBeInTheDocument();
    });

    const logoutBtn = screen.getByRole('button', { name: 'Log Out' });
    await userEvent.click(logoutBtn);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    
    // Settle pending re-renders
    await new Promise((r) => setTimeout(r, 50));
  });

  it('safely handles malformed localStorage data', async () => {
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', 'malformed-json-here');

    render(<App />);

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    // Settle pending re-renders
    await new Promise((r) => setTimeout(r, 50));
  });

  it('does not send role property in registration payload', async () => {
    const originalSetTimeout = window.setTimeout;
    
    // Intercept 2000ms delay to execute on next microtask, preventing TDZ crashes in JSDOM
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout').mockImplementation((cb: any, ms?: number) => {
      if (ms === 2000) {
        Promise.resolve().then(cb);
        return 9999 as any;
      }
      return originalSetTimeout(cb, ms);
    });

    (client.post as any).mockResolvedValue({
      data: {
        _id: '123',
        name: 'Alice Smith',
        email: 'alice@dealership.com',
        role: 'user',
      },
    });

    render(<App />);

    const registerLink = screen.getByText('Register here');
    await userEvent.click(registerLink);

    expect(screen.getByText('Create Account')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('john@dealership.com');
    const passwordInput = screen.getByPlaceholderText('Min. 6 characters');
    const submitBtn = screen.getByRole('button', { name: 'Register' });

    await userEvent.type(nameInput, 'Alice Smith');
    await userEvent.type(emailInput, 'alice@dealership.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Submit registration form
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Alice Smith',
        email: 'alice@dealership.com',
        password: 'password123',
      });
      // Verify redirect occurs and login view is shown
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    // Restore original setTimeout behavior
    setTimeoutSpy.mockRestore();
  });
});

describe('Frontend SPA Vehicle Showroom Dashboard & Filters', () => {
  const mockUser = {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@dealership.com',
    role: 'user',
  };
  const mockToken = 'mocked-jwt-token';

  const seededVehicles = [
    {
      _id: 'v1',
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: 5,
    },
    {
      _id: 'v2',
      make: 'Ford',
      model: 'F-150',
      category: 'Truck',
      price: 45000,
      quantity: 0, // out of stock
    },
  ];

  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    localStorage.clear();
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    vi.clearAllMocks();
  });

  it('fetches and renders vehicle lists onto dashboard cards', async () => {
    (getVehicles as any).mockResolvedValue(seededVehicles);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Dealership Showroom/i })).toBeInTheDocument();
      expect(screen.getByText(/Toyota/i)).toBeInTheDocument();
      expect(screen.getByText(/Camry/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Sedan/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/\$25,000/i)).toBeInTheDocument();
      expect(screen.getByText(/5 Units/i)).toBeInTheDocument();
    });
  });

  it('disables purchase button and displays Out of Stock when quantity is 0', async () => {
    (getVehicles as any).mockResolvedValue(seededVehicles);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Ford')).toBeInTheDocument();
    });

    const f150Card = screen.getByText('Ford').closest('article');
    const purchaseBtn = f150Card?.querySelector('button');

    expect(purchaseBtn).toBeDisabled();
    expect(purchaseBtn?.textContent).toBe('Out of Stock');
  });

  it('executes vehicle purchase successfully, decrements stock locally, and renders feedback', async () => {
    (getVehicles as any).mockResolvedValue(seededVehicles);
    (purchaseVehicle as any).mockResolvedValue({
      _id: 'v1',
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: 4, // decremented
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Toyota')).toBeInTheDocument();
    });

    const camryCard = screen.getByText('Toyota').closest('article');
    const purchaseBtn = camryCard?.querySelector('button') as HTMLButtonElement;

    await userEvent.click(purchaseBtn);

    await waitFor(() => {
      expect(purchaseVehicle).toHaveBeenCalledWith('v1');
      expect(screen.getByText('4 Units')).toBeInTheDocument();
      expect(screen.getByText('Successfully purchased Toyota Camry!')).toBeInTheDocument();
    });
  });

  it('handles out of stock conflict (HTTP 409) gracefully by disabling the purchase button', async () => {
    (getVehicles as any).mockResolvedValue(seededVehicles);
    const conflictError = {
      response: {
        status: 409,
        data: { message: 'Out of stock' },
      },
    };
    (purchaseVehicle as any).mockRejectedValue(conflictError);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Toyota')).toBeInTheDocument();
    });

    const camryCard = screen.getByText('Toyota').closest('article');
    const purchaseBtn = camryCard?.querySelector('button') as HTMLButtonElement;

    await userEvent.click(purchaseBtn);

    await waitFor(() => {
      expect(screen.getByText('This vehicle is currently out of stock.')).toBeInTheDocument();
      expect(purchaseBtn.textContent).toBe('Out of Stock');
      expect(purchaseBtn).toBeDisabled();
    });
  });

  it('sends correct parameters to query filters on submission', async () => {
    (getVehicles as any).mockResolvedValue(seededVehicles);
    (searchVehicles as any).mockResolvedValue([seededVehicles[0]]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dealership Showroom')).toBeInTheDocument();
    });

    const makeInput = screen.getByLabelText('Make');
    const modelInput = screen.getByLabelText('Model');
    const searchBtn = screen.getByRole('button', { name: 'Apply Filters' });

    await userEvent.type(makeInput, 'Toyota');
    await userEvent.type(modelInput, 'Camry');
    await userEvent.click(searchBtn);

    await waitFor(() => {
      expect(searchVehicles).toHaveBeenCalledWith({
        make: 'Toyota',
        model: 'Camry',
      });
      expect(screen.queryByText('Ford')).toBeNull();
      expect(screen.getByText('Toyota')).toBeInTheDocument();
    });
  });

  it('validates price input fields locally, blocking API request and rendering warnings', async () => {
    (getVehicles as any).mockResolvedValue(seededVehicles);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dealership Showroom')).toBeInTheDocument();
    });

    const minPriceInput = screen.getByLabelText('Min Price');
    const maxPriceInput = screen.getByLabelText('Max Price');
    const searchBtn = screen.getByRole('button', { name: 'Apply Filters' });

    await userEvent.type(minPriceInput, '30000');
    await userEvent.type(maxPriceInput, '20000');
    await userEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('Minimum price cannot be greater than maximum price')).toBeInTheDocument();
      expect(searchVehicles).not.toHaveBeenCalled();
    });
  });

  it('clears active filters and restores original full showroom listings', async () => {
    (getVehicles as any).mockResolvedValue(seededVehicles);
    (searchVehicles as any).mockResolvedValue([seededVehicles[0]]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dealership Showroom')).toBeInTheDocument();
    });

    const makeInput = screen.getByLabelText('Make');
    const clearBtn = screen.getByRole('button', { name: 'Clear' });

    await userEvent.type(makeInput, 'Toyota');
    const searchBtn = screen.getByRole('button', { name: 'Apply Filters' });
    await userEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.queryByText('Ford')).toBeNull();
    });

    await userEvent.click(clearBtn);

    await waitFor(() => {
      expect(makeInput).toHaveValue('');
      expect(getVehicles).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Ford')).toBeInTheDocument();
    });
  });

  it('hides admin action controls from normal authenticated users', async () => {
    // Normal user login state
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ _id: 'u1', name: 'User Name', email: 'user@dealership.com', role: 'user' }));

    (getVehicles as any).mockResolvedValue(seededVehicles);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Dealership Showroom/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Add New Vehicle/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Restock/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Delete/i })).toBeNull();
  });

  it('shows admin controls to admin users', async () => {
    localStorage.setItem('user', JSON.stringify({ ...mockUser, role: 'admin' }));
    (getVehicles as any).mockResolvedValue(seededVehicles);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add New Vehicle/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Restock/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /Edit/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /Delete/i }).length).toBeGreaterThan(0);
    });
  });

  it('allows admins to add new vehicles successfully', async () => {
    localStorage.setItem('user', JSON.stringify({ ...mockUser, role: 'admin' }));
    (getVehicles as any).mockResolvedValue(seededVehicles);
    const mockNewVehicle = {
      _id: 'v3',
      make: 'Honda',
      model: 'Accord',
      category: 'Sedan',
      price: 28000,
      quantity: 10,
    };
    (addVehicle as any).mockResolvedValue(mockNewVehicle);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add New Vehicle/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Add New Vehicle/i }));

    // Input values into add vehicle form fields using ID selectors to avoid filter label collisions
    await userEvent.type(document.querySelector('#add-make') as HTMLElement, 'Honda');
    await userEvent.type(document.querySelector('#add-model') as HTMLElement, 'Accord');
    await userEvent.selectOptions(document.querySelector('#add-category') as HTMLElement, 'Sedan');
    await userEvent.type(document.querySelector('#add-price') as HTMLElement, '28000');
    await userEvent.type(document.querySelector('#add-quantity') as HTMLElement, '10');

    await userEvent.click(screen.getByRole('button', { name: /Save Vehicle/i }));

    await waitFor(() => {
      expect(addVehicle).toHaveBeenCalledWith({
        make: 'Honda',
        model: 'Accord',
        category: 'Sedan',
        price: 28000,
        quantity: 10,
      });
      expect(screen.getByText(/Successfully added Honda Accord!/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Accord/i).length).toBeGreaterThan(0);
    });
  });

  it('allows admins to edit vehicle details successfully', async () => {
    localStorage.setItem('user', JSON.stringify({ ...mockUser, role: 'admin' }));
    (getVehicles as any).mockResolvedValue(seededVehicles);
    const mockUpdatedVehicle = {
      ...seededVehicles[0],
      price: 26000,
    };
    (updateVehicle as any).mockResolvedValue(mockUpdatedVehicle);

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Edit/i })[0]).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole('button', { name: /Edit/i })[0]);

    const priceInput = document.querySelector('#edit-price') as HTMLElement;
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '26000');

    await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updateVehicle).toHaveBeenCalledWith('v1', {
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 26000,
        quantity: 5,
      });
      expect(screen.getByText(/Successfully updated Toyota Camry!/i)).toBeInTheDocument();
      expect(screen.getByText('$26,000')).toBeInTheDocument();
    });
  });

  it('allows admins to restock vehicle quantities successfully', async () => {
    localStorage.setItem('user', JSON.stringify({ ...mockUser, role: 'admin' }));
    (getVehicles as any).mockResolvedValue(seededVehicles);
    const mockUpdatedVehicle = {
      ...seededVehicles[0],
      quantity: 15,
    };
    (restockVehicle as any).mockResolvedValue(mockUpdatedVehicle);

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Restock/i })[0]).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole('button', { name: /Restock/i })[0]);

    const qtyInput = document.querySelector('#restock-qty') as HTMLElement;
    await userEvent.type(qtyInput, '10');

    await userEvent.click(screen.getByRole('button', { name: /Submit Restock/i }));

    await waitFor(() => {
      expect(restockVehicle).toHaveBeenCalledWith('v1', 10);
      expect(screen.getByText(/Successfully restocked Toyota Camry to 15 units!/i)).toBeInTheDocument();
      expect(screen.getByText('15 Units')).toBeInTheDocument();
    });
  });

  it('allows admins to delete a vehicle successfully', async () => {
    localStorage.setItem('user', JSON.stringify({ ...mockUser, role: 'admin' }));
    (getVehicles as any).mockResolvedValue(seededVehicles);
    (deleteVehicle as any).mockResolvedValue({ message: 'Deleted' });

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Delete/i })[0]).toBeInTheDocument();
    });

    // Mock confirm dialog
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    await userEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteVehicle).toHaveBeenCalledWith('v1');
      expect(screen.getByText(/Successfully deleted Toyota Camry!/i)).toBeInTheDocument();
      expect(screen.queryByText('Camry')).toBeNull();
    });

    confirmSpy.mockRestore();
  });
});
