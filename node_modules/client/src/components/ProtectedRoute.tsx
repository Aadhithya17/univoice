import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  moderatorOrAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
  moderatorOrAdmin = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0f19] text-slate-400 light-theme:bg-slate-50 light-theme:text-slate-650">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide">Loading UniVoice...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, preserving original location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check admin requirements
  if (adminOnly && (user?.role !== 'admin' || user?.email !== 'admin@univoice.edu')) {
    return <Navigate to="/" replace />;
  }

  // Check moderator/admin requirements
  if (moderatorOrAdmin && (user?.role !== 'admin' && user?.role !== 'moderator' || user?.email !== 'admin@univoice.edu')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
export default ProtectedRoute;
