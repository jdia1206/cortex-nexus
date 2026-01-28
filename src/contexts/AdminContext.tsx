import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminContextType {
  isPlatformAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  platformRole: 'super_admin' | 'support_agent' | null;
  lastError: string | null;
  refreshAdminStatus: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [platformRole, setPlatformRole] = useState<'super_admin' | 'support_agent' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Track which user ID we've completed a check for
  const [checkedKey, setCheckedKey] = useState<string | null>(null);

  // The current key is the user's ID (or null if no user)
  const currentKey = user?.id ?? null;

  // Status is stale if we have a user but haven't checked for that user yet
  const isStale = currentKey !== null && checkedKey !== currentKey;

  // Effective loading: either actively loading OR status is stale
  const effectiveLoading = isLoading || isStale;

  const checkAdminStatus = useCallback(async (userId: string) => {
    setIsLoading(true);
    setLastError(null);

    try {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AdminContext] Error checking admin status for user:', userId, error.message);
        setLastError(error.message);
        setIsPlatformAdmin(false);
        setIsSuperAdmin(false);
        setPlatformRole(null);
      } else if (data) {
        setIsPlatformAdmin(true);
        setIsSuperAdmin(data.role === 'super_admin');
        setPlatformRole(data.role as 'super_admin' | 'support_agent');
        setLastError(null);
      } else {
        setIsPlatformAdmin(false);
        setIsSuperAdmin(false);
        setPlatformRole(null);
        setLastError(null);
      }
      
      // Mark this user as checked (even on error, to avoid infinite loading)
      setCheckedKey(userId);
    } catch (err) {
      console.error('[AdminContext] Unexpected error:', err);
      setLastError(err instanceof Error ? err.message : 'Unknown error');
      setIsPlatformAdmin(false);
      setIsSuperAdmin(false);
      setPlatformRole(null);
      setCheckedKey(userId);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual refresh function
  const refreshAdminStatus = useCallback(() => {
    if (currentKey) {
      checkAdminStatus(currentKey);
    }
  }, [currentKey, checkAdminStatus]);

  useEffect(() => {
    if (!user) {
      // No user: reset everything
      setIsPlatformAdmin(false);
      setIsSuperAdmin(false);
      setPlatformRole(null);
      setCheckedKey(null);
      setIsLoading(false);
      setLastError(null);
      return;
    }

    // Only check if we haven't checked for this user yet
    if (checkedKey !== user.id) {
      checkAdminStatus(user.id);
    }
  }, [user?.id, checkedKey, checkAdminStatus]);

  return (
    <AdminContext.Provider
      value={{
        isPlatformAdmin,
        isSuperAdmin,
        isLoading: effectiveLoading,
        platformRole,
        lastError,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
