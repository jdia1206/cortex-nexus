import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
}

export function AdminProtectedRoute({ children, requireSuperAdmin = false }: AdminProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isPlatformAdmin, isSuperAdmin, isLoading: adminLoading, lastError, refreshAdminStatus } = useAdmin();
  const location = useLocation();

  // Show loading while auth or admin status is being determined
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

  // If there was an error checking admin status, show retry option
  if (lastError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <p className="text-destructive mb-4">Admin access check failed</p>
          <p className="text-muted-foreground text-sm mb-4">{lastError}</p>
          <Button onClick={refreshAdminStatus} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but not a platform admin -> redirect to dashboard
  if (!isPlatformAdmin) {
    console.debug('[AdminProtectedRoute] User is not a platform admin, redirecting to dashboard. User ID:', user.id);
    return <Navigate to="/dashboard" replace />;
  }

  // Requires super admin but user is not -> redirect to admin home
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
