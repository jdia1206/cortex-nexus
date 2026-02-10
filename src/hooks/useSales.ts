import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type SalesInvoice = Tables<'sales_invoices'>;
type SalesInvoiceItem = Tables<'sales_invoice_items'>;

export function useSales() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: ['sales', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*, customers(name)')
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
      invoice: Omit<TablesInsert<'sales_invoices'>, 'tenant_id' | 'created_by'>;
      items: Omit<TablesInsert<'sales_invoice_items'>, 'tenant_id' | 'invoice_id'>[];
    }) => {
      // Create invoice with status and payment_method
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('sales_invoices')
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
        .from('sales_invoice_items')
        .insert(itemsWithIds);
      if (itemsError) throw itemsError;

      // Deduct stock from products
      for (const item of items) {
        if (item.product_id) {
          // Fetch current quantity then deduct
          const { data: prod } = await supabase
            .from('products')
            .select('quantity')
            .eq('id', item.product_id)
            .single();
          if (prod) {
            await supabase
              .from('products')
              .update({ quantity: Math.max(0, prod.quantity - item.quantity) })
              .eq('id', item.product_id);
          }
        }
      }

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(t('sales.created'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, payment_method }: { id: string; status: string; payment_method?: string | null }) => {
      const updateData: Record<string, unknown> = { status };
      if (payment_method !== undefined) {
        updateData.payment_method = payment_method;
      }
      const { data, error } = await supabase
        .from('sales_invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(t('sales.updated'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete items first
      await supabase.from('sales_invoice_items').delete().eq('invoice_id', id);
      // Then delete invoice
      const { error } = await supabase.from('sales_invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(t('sales.deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    sales: query.data ?? [],
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
