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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PurchasesFormDialog } from '@/components/purchases/PurchasesFormDialog';
import { CheckCircle, XCircle, MoreHorizontal, Download } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdf/reportGenerator';

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
  const { purchases, isLoading, create, updateStatus, delete: deletePurchase, isCreating, isDeleting } = usePurchases();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();
  const { formatCurrency, currency } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseInvoice | null>(null);

  const handleStatusChange = async (purchase: PurchaseInvoice, newStatus: string) => {
    await updateStatus({ id: purchase.id, status: newStatus });
  };

  const handleDownloadPDF = (purchase: PurchaseInvoice) => {
    const doc = generateInvoicePDF(
      'purchase',
      {
        invoiceNumber: purchase.invoice_number,
        date: purchase.invoice_date,
        supplier: purchase.suppliers ? { name: purchase.suppliers.name } : undefined,
        items: [],
        subtotal: Number(purchase.subtotal),
        taxAmount: Number(purchase.tax_amount),
        total: Number(purchase.total),
      },
      {
        name: tenant?.name || 'Company',
        address: tenant?.address || undefined,
        phone: tenant?.phone || undefined,
        email: tenant?.email || undefined,
        taxId: tenant?.tax_id || undefined,
      },
      currency.symbol
    );
    doc.save(`${purchase.invoice_number}.pdf`);
  };

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
        <div className="flex items-center gap-2">
          <Badge variant={
            purchase.status === 'received' ? 'default' : 
            purchase.status === 'cancelled' ? 'destructive' : 'secondary'
          }>
            {t(`purchases.${purchase.status}`)}
          </Badge>
          {purchase.status === 'pending' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange(purchase, 'received')}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  {t('purchases.markReceived')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(purchase, 'cancelled')}>
                  <XCircle className="h-4 w-4 mr-2 text-destructive" />
                  {t('purchases.markCancelled')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
    },
    {
      key: 'download',
      header: '',
      render: (purchase) => (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadPDF(purchase);
          }}
          title={t('common.export')}
        >
          <Download className="h-4 w-4" />
        </Button>
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
