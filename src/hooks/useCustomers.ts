import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type Customer = Tables<'customers'>;
type CustomerInsert = TablesInsert<'customers'>;
type CustomerUpdate = TablesUpdate<'customers'>;

export function useCustomers() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['customers', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', profile!.tenant_id)
        .order('name');
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!profile?.tenant_id,
  });

  const createMutation = useMutation({
    mutationFn: async (customer: Omit<CustomerInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, tenant_id: profile!.tenant_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('customers.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...customer }: CustomerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('customers.updated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('customers.deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
