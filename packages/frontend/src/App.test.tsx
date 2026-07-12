import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import client from './api/client';

// Mock the API client
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

// A robust localStorage mock for JSDOM environments in Vitest
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Frontend SPA Authentication Flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
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

    render(<App />);

    const emailInput = screen.getByPlaceholderText('name@dealership.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });

    await userEvent.type(emailInput, 'john@dealership.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(window.localStorage.getItem('token')).toBe(mockToken);
      expect(JSON.parse(window.localStorage.getItem('user') || '')).toEqual(mockUser);
    });

    expect(screen.getByText('Welcome to Dealership Manager')).toBeInTheDocument();
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
    window.localStorage.setItem('token', mockToken);
    window.localStorage.setItem('user', JSON.stringify(mockUser));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Dealership Manager')).toBeInTheDocument();
    });

    const logoutBtn = screen.getByRole('button', { name: 'Log Out' });
    await userEvent.click(logoutBtn);

    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('safely handles malformed localStorage data', async () => {
    window.localStorage.setItem('token', 'some-token');
    window.localStorage.setItem('user', 'malformed-json-here');

    render(<App />);

    await waitFor(() => {
      expect(window.localStorage.getItem('token')).toBeNull();
      expect(window.localStorage.getItem('user')).toBeNull();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  it('does not send role property in registration payload', async () => {
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
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Alice Smith',
        email: 'alice@dealership.com',
        password: 'password123',
      });
    });
  });
});
