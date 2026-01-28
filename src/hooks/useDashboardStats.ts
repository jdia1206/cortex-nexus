import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  inventoryValue: number;
  lowStockCount: number;
  recentSales: Array<{
    id: string;
    invoice_number: string;
    customer_name: string | null;
    total: number;
    status: string;
    invoice_date: string;
  }>;
  recentPurchases: Array<{
    id: string;
    invoice_number: string;
    supplier_name: string | null;
    total: number;
    status: string;
    invoice_date: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

export function useDashboardStats() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', profile?.tenant_id],
    queryFn: async (): Promise<DashboardStats> => {
      const tenantId = profile!.tenant_id;

      // Fetch all data in parallel
      const [
        salesResult,
        purchasesResult,
        productsResult,
        recentSalesResult,
        recentPurchasesResult,
        salesItemsResult,
      ] = await Promise.all([
        // Total sales (paid invoices)
        supabase
          .from('sales_invoices')
          .select('total')
          .eq('tenant_id', tenantId)
          .eq('status', 'paid'),
        
        // Total purchases (received)
        supabase
          .from('purchase_invoices')
          .select('total')
          .eq('tenant_id', tenantId)
          .eq('status', 'received'),
        
        // Products for inventory value and low stock
        supabase
          .from('products')
          .select('id, name, cost, quantity, min_stock, is_active')
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
        
        // Recent sales with customer names
        supabase
          .from('sales_invoices')
          .select(`
            id,
            invoice_number,
            total,
            status,
            invoice_date,
            customers (name)
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Recent purchases with supplier names
        supabase
          .from('purchase_invoices')
          .select(`
            id,
            invoice_number,
            total,
            status,
            invoice_date,
            suppliers (name)
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Sales items for top products
        supabase
          .from('sales_invoice_items')
          .select(`
            quantity,
            subtotal,
            product_id,
            products (id, name)
          `)
          .eq('tenant_id', tenantId),
      ]);

      // Calculate totals
      const totalSales = salesResult.data?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      const totalPurchases = purchasesResult.data?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      
      // Calculate inventory value and low stock
      const products = productsResult.data || [];
      const inventoryValue = products.reduce((sum, p) => sum + (Number(p.cost) * (p.quantity || 0)), 0);
      const lowStockCount = products.filter(p => (p.quantity || 0) < (p.min_stock || 0)).length;

      // Format recent sales
      const recentSales = (recentSalesResult.data || []).map((sale: any) => ({
        id: sale.id,
        invoice_number: sale.invoice_number,
        customer_name: sale.customers?.name || null,
        total: Number(sale.total),
        status: sale.status,
        invoice_date: sale.invoice_date,
      }));

      // Format recent purchases
      const recentPurchases = (recentPurchasesResult.data || []).map((purchase: any) => ({
        id: purchase.id,
        invoice_number: purchase.invoice_number,
        supplier_name: purchase.suppliers?.name || null,
        total: Number(purchase.total),
        status: purchase.status,
        invoice_date: purchase.invoice_date,
      }));

      // Calculate top products by revenue
      const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
      (salesItemsResult.data || []).forEach((item: any) => {
        if (item.product_id && item.products) {
          const id = item.product_id;
          if (!productStats[id]) {
            productStats[id] = { name: item.products.name, quantity: 0, revenue: 0 };
          }
          productStats[id].quantity += item.quantity;
          productStats[id].revenue += Number(item.subtotal);
        }
      });

      const topProducts = Object.entries(productStats)
        .map(([id, stats]) => ({
          id,
          name: stats.name,
          quantity_sold: stats.quantity,
          revenue: stats.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        totalSales,
        totalPurchases,
        inventoryValue,
        lowStockCount,
        recentSales,
        recentPurchases,
        topProducts,
      };
    },
    enabled: !!profile?.tenant_id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
