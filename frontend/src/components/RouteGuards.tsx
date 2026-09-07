import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Route guard for routes that require an authenticated user.
 * Redirects to /login if the user is unauthenticated.
 */
export const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/**
 * Route guard for routes that require an unauthenticated user (e.g., login, register).
 * Redirects authenticated users to their profile.
 */
export const GuestRoute: React.FC = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};
export default ProtectedRoute;
