import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type Warehouse = Tables<'warehouses'>;
type WarehouseInsert = TablesInsert<'warehouses'>;
type WarehouseUpdate = TablesUpdate<'warehouses'>;

export function useWarehouses() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['warehouses', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*, branches(name)')
        .eq('tenant_id', profile!.tenant_id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const createMutation = useMutation({
    mutationFn: async (warehouse: Omit<WarehouseInsert, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert({ ...warehouse, tenant_id: profile!.tenant_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(t('warehouses.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...warehouse }: WarehouseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('warehouses')
        .update(warehouse)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(t('warehouses.updated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('warehouses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(t('warehouses.deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    warehouses: query.data ?? [],
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
