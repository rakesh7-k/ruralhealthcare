import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Role } from '@sethu/shared';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, activeRole, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleNames = user.roles.map((r) => r.roleName as Role);
    const hasAllowedRole = allowedRoles.some(
      (role) => userRoleNames.includes(role) || activeRole === role
    );

    if (!hasAllowedRole) {
      return (
        <div className="p-8 max-w-2xl mx-auto mt-12 bg-white rounded-xl shadow-sm border border-rose-200">
          <h2 className="text-xl font-bold text-rose-700 mb-2">Access Restricted</h2>
          <p className="text-slate-600 mb-4">
            Your current account role (<strong>{activeRole}</strong>) does not have access to this portal section.
          </p>
          <div className="flex space-x-3">
            <Navigate to={`/${activeRole?.toLowerCase() || 'patient'}`} />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
