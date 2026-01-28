import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, Column } from '@/components/shared';
import { useInventory } from '@/hooks/useInventory';
import { useWarehouses } from '@/hooks/useWarehouses';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

type InventoryWithRelations = {
  id: string;
  quantity: number;
  products: { name: string; sku: string | null; min_stock: number | null } | null;
  warehouses: { name: string } | null;
  tenant_id: string;
  product_id: string;
  warehouse_id: string;
  created_at: string;
  updated_at: string;
};

export default function Inventory() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { inventory, isLoading } = useInventory();
  const { warehouses } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  const filteredInventory = selectedWarehouse === 'all'
    ? inventory
    : inventory.filter((item: any) => item.warehouse_id === selectedWarehouse);

  const columns: Column<InventoryWithRelations>[] = [
    { 
      key: 'product', 
      header: t('inventory.product'),
      render: (item) => item.products?.name || '-',
    },
    { 
      key: 'sku', 
      header: t('products.sku'),
      render: (item) => item.products?.sku || '-',
    },
    { 
      key: 'warehouse', 
      header: t('inventory.warehouse'),
      render: (item) => item.warehouses?.name || '-',
    },
    { 
      key: 'quantity', 
      header: t('inventory.quantity'),
      render: (item) => item.quantity,
    },
    { 
      key: 'min_stock', 
      header: t('products.minStock'),
      render: (item) => item.products?.min_stock || 0,
    },
    { 
      key: 'status', 
      header: t('inventory.status'),
      render: (item) => {
        const minStock = item.products?.min_stock || 0;
        const isLow = item.quantity <= minStock;
        return (
          <Badge variant={isLow ? 'destructive' : 'default'} className="gap-1">
            {isLow && <AlertTriangle className="h-3 w-3" />}
            {isLow ? t('inventory.lowStock') : t('inventory.inStock')}
          </Badge>
        );
      },
    },
  ];

  return (
    <AppLayout
      companyName={tenant?.name}
      userName={profile?.full_name}
      onLogout={signOut}
    >
      <div className="space-y-6">
        <PageHeader
          title={t('inventory.title')}
          description={t('inventory.description')}
        />

        <div className="flex gap-4">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('inventory.filterByWarehouse')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {warehouses.map((warehouse: any) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          data={filteredInventory as any[]}
          columns={columns as any}
          isLoading={isLoading}
          emptyTitle={t('inventory.empty')}
          emptyDescription={t('inventory.emptyDescription')}
        />
      </div>
    </AppLayout>
  );
}
