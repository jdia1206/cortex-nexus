import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type Tenant = Tables<'tenants'>;
type TenantUpdate = TablesUpdate<'tenants'>;

export function useTenant() {
  const { tenant, profile } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const updateMutation = useMutation({
    mutationFn: async (data: TenantUpdate) => {
      const { data: updated, error } = await supabase
        .from('tenants')
        .update(data)
        .eq('id', profile!.tenant_id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      toast.success(t('company.updated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    tenant,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
