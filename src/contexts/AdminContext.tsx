import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface AdminContextType {
  isPlatformAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  platformRole: 'super_admin' | 'support_agent' | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [platformRole, setPlatformRole] = useState<'super_admin' | 'support_agent' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsPlatformAdmin(false);
        setIsSuperAdmin(false);
        setPlatformRole(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('platform_admins')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsPlatformAdmin(true);
          setIsSuperAdmin(data.role === 'super_admin');
          setPlatformRole(data.role as 'super_admin' | 'support_agent');
        } else {
          setIsPlatformAdmin(false);
          setIsSuperAdmin(false);
          setPlatformRole(null);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsPlatformAdmin(false);
        setIsSuperAdmin(false);
        setPlatformRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id, pathname]);

  return (
    <AdminContext.Provider
      value={{
        isPlatformAdmin,
        isSuperAdmin,
        isLoading,
        platformRole,
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
