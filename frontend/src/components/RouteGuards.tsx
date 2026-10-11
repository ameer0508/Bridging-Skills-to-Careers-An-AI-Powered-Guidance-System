import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Route guard for routes that require an authenticated user.
 * Redirects to /login if the user is unauthenticated, preserving destination.
 */
export const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

/**
 * Route guard for routes that require an unauthenticated user (e.g., login, register).
 * Redirects authenticated users to the Home Command Center.
 */
export const GuestRoute: React.FC = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};
export default ProtectedRoute;
