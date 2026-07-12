import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await client.post('/auth/register', { name, email, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Get started with your inventory profile</p>

        {error && <div className="alert-error" data-testid="error-message">{error}</div>}
        {success && (
          <div style={{ backgroundColor: 'rgba(48, 209, 88, 0.1)', border: '1px solid rgba(48, 209, 88, 0.2)', borderRadius: '10px', color: '#30d158', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              className="form-input"
              type="text"
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || success}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              className="form-input"
              type="email"
              id="email"
              placeholder="john@dealership.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || success}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              className="form-input"
              type="password"
              id="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || success}
              required
            />
          </div>

          <button className="btn" type="submit" disabled={loading || success}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link className="auth-link" to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};
