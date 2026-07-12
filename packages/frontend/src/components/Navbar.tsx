import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar">
      <a className="navbar-brand" href="/">
        🚗 Dealership Manager
      </a>
      <div className="navbar-menu">
        <div className="user-info">
          <span>{user.name}</span>
          <span className={`user-badge ${user.role}`}>
            {user.role}
          </span>
        </div>
        <button className="btn-nav-logout" onClick={logout}>
          Log Out
        </button>
      </div>
    </nav>
  );
};
