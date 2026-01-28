import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import { SalesFormDialog } from '@/components/sales/SalesFormDialog';
import { useCurrency } from '@/contexts/CurrencyContext';

type SalesInvoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  customers: { name: string } | null;
};

export default function Sales() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { sales, isLoading, create, delete: deleteSale, isCreating, isDeleting } = useSales();
  const { products } = useProducts();
  const { formatCurrency } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SalesInvoice | null>(null);

  const columns: Column<SalesInvoice>[] = [
    { key: 'invoice_number', header: t('sales.invoiceNumber') },
    { 
      key: 'customer', 
      header: t('sales.customer'),
      render: (sale) => sale.customers?.name || '-',
    },
    { key: 'invoice_date', header: t('sales.date') },
    { 
      key: 'total', 
      header: t('sales.total'),
      render: (sale) => formatCurrency(Number(sale.total)),
    },
    { 
      key: 'status', 
      header: t('sales.status'),
      render: (sale) => (
        <Badge variant={
          sale.status === 'paid' ? 'default' : 
          sale.status === 'cancelled' ? 'destructive' : 'secondary'
        }>
          {t(`sales.${sale.status}`)}
        </Badge>
      ),
    },
  ];

  const handleDelete = (sale: SalesInvoice) => {
    setSelectedSale(sale);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedSale) {
      await deleteSale(selectedSale.id);
      setDeleteOpen(false);
      setSelectedSale(null);
    }
  };

  const handleSubmit = async (data: {
    invoice: {
      invoice_number: string;
      customer_id: string | null;
      notes: string | null;
      discount_amount: number;
      subtotal: number;
      tax_amount: number;
      total: number;
    };
    items: {
      product_id: string | null;
      quantity: number;
      unit_price: number;
      tax_rate: number;
      subtotal: number;
    }[];
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  }) => {
    // Store customer info in notes for now (can be extended to create/link customer)
    const customerNote = data.customerInfo.firstName || data.customerInfo.lastName 
      ? `Customer: ${data.customerInfo.firstName} ${data.customerInfo.lastName}`.trim() +
        (data.customerInfo.email ? ` | Email: ${data.customerInfo.email}` : '') +
        (data.customerInfo.phone ? ` | Phone: ${data.customerInfo.phone}` : '')
      : '';

    const notes = [customerNote, data.invoice.notes].filter(Boolean).join('\n');

    await create({
      invoice: {
        ...data.invoice,
        notes: notes || null,
      },
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
          title={t('sales.title')}
          description={t('sales.description')}
          actionLabel={t('sales.add')}
          onAction={() => setFormOpen(true)}
        />

        <DataTable
          data={sales as SalesInvoice[]}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['invoice_number']}
          searchPlaceholder={t('sales.searchPlaceholder')}
          onDelete={handleDelete}
          emptyTitle={t('sales.empty')}
          emptyDescription={t('sales.emptyDescription')}
          emptyAction={t('sales.add')}
          onEmptyAction={() => setFormOpen(true)}
        />

        <SalesFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          products={products}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          salesCount={sales.length}
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
