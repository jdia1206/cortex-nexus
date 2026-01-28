import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { usePurchases } from '@/hooks/usePurchases';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/badge';
import { PurchasesFormDialog } from '@/components/purchases/PurchasesFormDialog';

type PurchaseInvoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  suppliers: { name: string } | null;
  warehouses: { name: string } | null;
};

export default function Purchases() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { purchases, isLoading, create, delete: deletePurchase, isCreating, isDeleting } = usePurchases();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();
  const { formatCurrency } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseInvoice | null>(null);

  const columns: Column<PurchaseInvoice>[] = [
    { key: 'invoice_number', header: t('purchases.invoiceNumber') },
    { 
      key: 'supplier', 
      header: t('purchases.supplier'),
      render: (purchase) => purchase.suppliers?.name || '-',
    },
    { 
      key: 'warehouse', 
      header: t('purchases.warehouse'),
      render: (purchase) => purchase.warehouses?.name || '-',
    },
    { key: 'invoice_date', header: t('purchases.date') },
    { 
      key: 'total', 
      header: t('purchases.total'),
      render: (purchase) => formatCurrency(Number(purchase.total)),
    },
    { 
      key: 'status', 
      header: t('purchases.status'),
      render: (purchase) => (
        <Badge variant={
          purchase.status === 'received' ? 'default' : 
          purchase.status === 'cancelled' ? 'destructive' : 'secondary'
        }>
          {t(`purchases.${purchase.status}`)}
        </Badge>
      ),
    },
  ];

  const handleDelete = (purchase: PurchaseInvoice) => {
    setSelectedPurchase(purchase);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedPurchase) {
      await deletePurchase(selectedPurchase.id);
      setDeleteOpen(false);
      setSelectedPurchase(null);
    }
  };

  const handleSubmit = async (data: {
    invoice: {
      invoice_number: string;
      supplier_id: string | null;
      warehouse_id: string | null;
      notes: string | null;
      subtotal: number;
      tax_amount: number;
      total: number;
    };
    items: {
      product_id: string | null;
      quantity: number;
      unit_cost: number;
      subtotal: number;
    }[];
  }) => {
    await create({
      invoice: data.invoice,
      items: data.items,
    });
  };

  return (
    <AppLayout
      companyName={tenant?.name}
      userName={profile?.full_name}
      onLogout={signOut}
    >
      <div className="space-y-6">
        <PageHeader
          title={t('purchases.title')}
          description={t('purchases.description')}
          actionLabel={t('purchases.add')}
          onAction={() => setFormOpen(true)}
        />

        <DataTable
          data={purchases as PurchaseInvoice[]}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['invoice_number']}
          searchPlaceholder={t('purchases.searchPlaceholder')}
          onDelete={handleDelete}
          emptyTitle={t('purchases.empty')}
          emptyDescription={t('purchases.emptyDescription')}
          emptyAction={t('purchases.add')}
          onEmptyAction={() => setFormOpen(true)}
        />

        <PurchasesFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          products={products}
          suppliers={suppliers}
          warehouses={warehouses as any[]}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          purchasesCount={purchases.length}
        />

        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
