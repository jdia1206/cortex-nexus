import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';

interface AdminProtectedRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export function AdminProtectedRoute({ children, requireSuperAdmin = false }: AdminProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isPlatformAdmin, isSuperAdmin, isLoading: adminLoading } = useAdmin();
  const location = useLocation();

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
