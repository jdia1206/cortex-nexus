import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type Inventory = Tables<'inventory'>;
type InventoryUpdate = TablesUpdate<'inventory'>;

export function useInventory() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['inventory', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, products(name, sku, min_stock), warehouses(name)')
        .eq('tenant_id', profile!.tenant_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('inventory')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(t('inventory.adjusted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (inventory: Omit<TablesInsert<'inventory'>, 'tenant_id'>) => {
      const { data, error } = await supabase
        .from('inventory')
        .insert({ ...inventory, tenant_id: profile!.tenant_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(t('inventory.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    inventory: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    adjust: adjustMutation.mutateAsync,
    create: createMutation.mutateAsync,
    isAdjusting: adjustMutation.isPending,
  };
}
