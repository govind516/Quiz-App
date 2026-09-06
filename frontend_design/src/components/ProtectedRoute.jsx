import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Wraps a route subtree and redirects away if the access requirement isn't met.
// requireAdmin=true is used for the /admin/* section so non-admins (including
// guests and logged-in players) can never reach it, even by typing the URL directly.
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/login" replace state={{ from: location, reason: 'admin-required' }} />;
  }
  if (!requireAdmin && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
