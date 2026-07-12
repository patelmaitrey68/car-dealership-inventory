import React from 'react';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-wrapper">
      <div className="welcome-banner">
        <h1 className="welcome-title">Welcome to Dealership Manager</h1>
        <p className="welcome-desc">
          Hello, <strong>{user?.name}</strong>. You are currently logged in as a{' '}
          <span style={{ color: user?.role === 'admin' ? '#ff453a' : '#5856d6', fontWeight: 600 }}>
            {user?.role}
          </span>
          .
        </p>
        <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Authentication succeeded. Vehicle inventory features are coming next.
        </p>
      </div>
    </div>
  );
};
