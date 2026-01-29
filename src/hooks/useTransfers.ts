import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface TransferItem {
  product_id: string;
  quantity_sent: number;
  notes?: string;
}

export interface CreateTransferData {
  source_warehouse_id: string;
  destination_warehouse_id: string;
  expected_arrival?: string;
  notes?: string;
  items: TransferItem[];
}

export function useTransfers() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['transfers', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_transfers')
        .select(`
          *,
          source_warehouse:warehouses!inventory_transfers_source_warehouse_id_fkey(name, branches(name)),
          destination_warehouse:warehouses!inventory_transfers_destination_warehouse_id_fkey(name, branches(name))
        `)
        .eq('tenant_id', profile!.tenant_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const generateTransferNumber = (count: number): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = (count + 1).toString().padStart(4, '0');
    return `TRF-${year}${month}${day}-${sequence}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateTransferData) => {
      const transferNumber = generateTransferNumber(query.data?.length || 0);

      // Create transfer
      const { data: transferData, error: transferError } = await supabase
        .from('inventory_transfers')
        .insert({
          tenant_id: profile!.tenant_id,
          transfer_number: transferNumber,
          source_warehouse_id: data.source_warehouse_id,
          destination_warehouse_id: data.destination_warehouse_id,
          expected_arrival: data.expected_arrival || null,
          notes: data.notes || null,
          created_by: user!.id,
        })
        .select()
        .single();
      if (transferError) throw transferError;

      // Create transfer items
      const itemsWithIds = data.items.map((item) => ({
        ...item,
        transfer_id: transferData.id,
        tenant_id: profile!.tenant_id,
      }));

      const { error: itemsError } = await supabase
        .from('transfer_items')
        .insert(itemsWithIds);
      if (itemsError) throw itemsError;

      return transferData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success(t('transfers.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, approved_by }: { id: string; status: string; approved_by?: string }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === 'in_transit' && approved_by) {
        updateData.approved_by = approved_by;
        updateData.approved_at = new Date().toISOString();
      }
      
      if (status === 'received') {
        updateData.received_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('inventory_transfers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(t('transfers.updated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('transfer_items').delete().eq('transfer_id', id);
      const { error } = await supabase.from('inventory_transfers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast.success(t('transfers.deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    transfers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
