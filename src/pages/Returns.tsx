import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useReturns } from '@/hooks/useReturns';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ReturnFormDialog } from '@/components/returns/ReturnFormDialog';
import { Download } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdf/reportGenerator';

type Return = {
  id: string;
  return_number: string;
  return_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  refund_amount: number | null;
  reason: string | null;
  customers: { name: string } | null;
  sales_invoices: { invoice_number: string } | null;
};

export default function Returns() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { returns, isLoading, create, updateStatus, delete: deleteReturn, isCreating, isDeleting } = useReturns();
  const { sales } = useSales();
  const { products } = useProducts();
  const { formatCurrency, currency } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'refunded': return 'default';
      case 'approved': return 'secondary';
      case 'rejected': return 'destructive';
      case 'inspecting': return 'outline';
      default: return 'secondary';
    }
  };

  const handleDownloadPDF = (ret: Return) => {
    const doc = generateInvoicePDF(
      'return',
      {
        invoiceNumber: ret.return_number,
        date: ret.return_date,
        customer: ret.customers ? { name: ret.customers.name } : undefined,
        items: [],
        subtotal: Number(ret.subtotal),
        taxAmount: Number(ret.tax_amount),
        total: Number(ret.total),
        notes: ret.reason || undefined,
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
    doc.save(`${ret.return_number}.pdf`);
  };

  const columns: Column<Return>[] = [
    { key: 'return_number', header: t('returns.returnNumber') },
    { 
      key: 'original_invoice', 
      header: t('returns.originalInvoice'),
      render: (ret) => ret.sales_invoices?.invoice_number || '-',
    },
    { 
      key: 'customer', 
      header: t('returns.customer'),
      render: (ret) => ret.customers?.name || '-',
    },
    { key: 'return_date', header: t('returns.date') },
    { 
      key: 'total', 
      header: t('returns.total'),
      render: (ret) => formatCurrency(Number(ret.total)),
    },
    { 
      key: 'refund_amount', 
      header: t('returns.refundAmount'),
      render: (ret) => ret.refund_amount ? formatCurrency(Number(ret.refund_amount)) : '-',
    },
    { 
      key: 'status', 
      header: t('returns.status'),
      render: (ret) => (
        <Badge variant={statusVariant(ret.status)}>
          {t(`returns.${ret.status}`)}
        </Badge>
      ),
    },
    {
      key: 'download',
      header: '',
      render: (ret) => (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadPDF(ret);
          }}
          title={t('common.export')}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handleDelete = (ret: Return) => {
    setSelectedReturn(ret);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedReturn) {
      await deleteReturn(selectedReturn.id);
      setDeleteOpen(false);
      setSelectedReturn(null);
    }
  };

  return (
    <AppLayout
      companyName={tenant?.name}
      userName={profile?.full_name}
      onLogout={signOut}
    >
      <div className="space-y-6">
        <PageHeader
          title={t('returns.title')}
          description={t('returns.description')}
          actionLabel={t('returns.add')}
          onAction={() => setFormOpen(true)}
        />

        <DataTable
          data={returns as Return[]}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['return_number']}
          searchPlaceholder={t('returns.searchPlaceholder')}
          onDelete={handleDelete}
          emptyTitle={t('returns.empty')}
          emptyDescription={t('returns.emptyDescription')}
          emptyAction={t('returns.add')}
          onEmptyAction={() => setFormOpen(true)}
        />

        <ReturnFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          sales={sales}
          products={products}
          onSubmit={create}
          isSubmitting={isCreating}
          returnsCount={returns.length}
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
