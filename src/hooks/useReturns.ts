import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ReturnItem {
  product_id: string | null;
  original_quantity: number;
  return_quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
  condition: string;
  restock: boolean;
}

export interface CreateReturnData {
  sales_invoice_id: string;
  customer_id: string | null;
  reason: string | null;
  notes: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  items: ReturnItem[];
}

export function useReturns() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['returns', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('*, customers(name), sales_invoices(invoice_number)')
        .eq('tenant_id', profile!.tenant_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const generateReturnNumber = (count: number): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RET-${year}${month}${day}-${sequence}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateReturnData) => {
      const returnNumber = generateReturnNumber(query.data?.length || 0);

      // Create return
      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .insert({
          tenant_id: profile!.tenant_id,
          return_number: returnNumber,
          sales_invoice_id: data.sales_invoice_id,
          customer_id: data.customer_id,
          reason: data.reason,
          notes: data.notes,
          subtotal: data.subtotal,
          tax_amount: data.tax_amount,
          total: data.total,
          created_by: user!.id,
        })
        .select()
        .single();
      if (returnError) throw returnError;

      // Create return items
      const itemsWithIds = data.items.map((item) => ({
        ...item,
        return_id: returnData.id,
        tenant_id: profile!.tenant_id,
      }));

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(itemsWithIds);
      if (itemsError) throw itemsError;

      // Add items to returns_inventory for inspection
      const inventoryItems = data.items.map((item) => ({
        tenant_id: profile!.tenant_id,
        product_id: item.product_id,
        quantity: item.return_quantity,
        condition: 'pending_inspection',
      }));

      const { error: invError } = await supabase
        .from('returns_inventory')
        .insert(inventoryItems);
      if (invError) throw invError;

      return returnData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['returns-inventory'] });
      toast.success(t('returns.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, refund_amount }: { id: string; status: string; refund_amount?: number }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'refunded' && refund_amount !== undefined) {
        updateData.refund_amount = refund_amount;
        updateData.refunded_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('returns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success(t('returns.updated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('return_items').delete().eq('return_id', id);
      const { error } = await supabase.from('returns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success(t('returns.deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    returns: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
