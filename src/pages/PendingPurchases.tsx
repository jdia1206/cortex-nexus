import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, Column } from '@/components/shared';
import { usePurchases } from '@/hooks/usePurchases';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

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

export default function PendingPurchases() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { purchases, isLoading, updateStatus } = usePurchases();
  const { formatCurrency } = useCurrency();

  const pendingPurchases = purchases.filter(
    (p: any) => p.status === 'pending'
  ) as PurchaseInvoice[];

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateStatus({ id, status: newStatus });
  };

  const columns: Column<PurchaseInvoice>[] = [
    { key: 'invoice_number', header: t('purchases.invoiceNumber') },
    {
      key: 'supplier',
      header: t('purchases.supplier'),
      render: (p) => p.suppliers?.name || '-',
    },
    {
      key: 'warehouse',
      header: t('purchases.warehouse'),
      render: (p) => p.warehouses?.name || '-',
    },
    { key: 'invoice_date', header: t('purchases.date') },
    {
      key: 'total',
      header: t('purchases.total'),
      render: (p) => formatCurrency(Number(p.total)),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (p) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => handleStatusChange(p.id, 'received')}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {t('purchases.markReceived')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => handleStatusChange(p.id, 'cancelled')}
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            {t('purchases.markCancelled')}
          </Button>
        </div>
      ),
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
          title={t('purchases.pendingTitle')}
          description={t('purchases.pendingDescription')}
        />

        <DataTable
          data={pendingPurchases}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['invoice_number']}
          searchPlaceholder={t('purchases.searchPlaceholder')}
          emptyTitle={t('purchases.noPending')}
          emptyDescription={t('purchases.noPendingDescription')}
        />
      </div>
    </AppLayout>
  );
}
