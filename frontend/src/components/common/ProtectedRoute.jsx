import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const defaultRedirectForRole = (role) => {
  if (role === 'doctor') return '/doctor-dashboard';
  if (role === 'patient') return '/dashboard';
  if (role === 'admin') return '/admin-dashboard';
  return '/';
};

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-6 bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-semibold">Checking access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to={defaultRedirectForRole(user.role)} replace />;
  }

  return children;
}
