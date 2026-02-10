import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type PurchaseInvoice = Tables<'purchase_invoices'>;

export function usePurchases() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['purchases', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('*, suppliers(name), warehouses(name)')
        .eq('tenant_id', profile!.tenant_id)
        .order('invoice_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const createMutation = useMutation({
    mutationFn: async ({
      invoice,
      items,
    }: {
      invoice: Omit<TablesInsert<'purchase_invoices'>, 'tenant_id' | 'created_by'>;
      items: Omit<TablesInsert<'purchase_invoice_items'>, 'tenant_id' | 'invoice_id'>[];
    }) => {
      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert({ 
          ...invoice, 
          tenant_id: profile!.tenant_id,
          created_by: user!.id,
        })
        .select()
        .single();
      if (invoiceError) throw invoiceError;

      // Create items
      const itemsWithIds = items.map((item) => ({
        ...item,
        invoice_id: invoiceData.id,
        tenant_id: profile!.tenant_id,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_invoice_items')
        .insert(itemsWithIds);
      if (itemsError) throw itemsError;

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(t('purchases.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success(t('purchases.updated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('purchase_invoice_items').delete().eq('invoice_id', id);
      const { error } = await supabase.from('purchase_invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success(t('purchases.deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    purchases: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
