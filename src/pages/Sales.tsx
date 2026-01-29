import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SalesFormDialog } from '@/components/sales/SalesFormDialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Download } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdf/reportGenerator';

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
  const { customers, create: createCustomer } = useCustomers();
  const { formatCurrency, currency } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SalesInvoice | null>(null);

  const handleDownloadPDF = (sale: SalesInvoice) => {
    const doc = generateInvoicePDF(
      'sale',
      {
        invoiceNumber: sale.invoice_number,
        date: sale.invoice_date,
        customer: sale.customers ? { name: sale.customers.name } : undefined,
        items: [],
        subtotal: Number(sale.subtotal),
        taxAmount: Number(sale.tax_amount),
        discount: Number(sale.discount_amount),
        total: Number(sale.total),
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
    doc.save(`${sale.invoice_number}.pdf`);
  };

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
    {
      key: 'download',
      header: '',
      render: (sale) => (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadPDF(sale);
          }}
          title={t('common.export')}
        >
          <Download className="h-4 w-4" />
        </Button>
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
      customerType: 'person' | 'company';
      companyName: string;
      taxId: string;
      contactPerson: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  }) => {
    let customerId = data.invoice.customer_id;

    // If no existing customer selected and new customer info provided, create customer
    if (!customerId && (data.customerInfo.firstName || data.customerInfo.lastName || data.customerInfo.companyName)) {
      const isCompany = data.customerInfo.customerType === 'company';
      const customerName = isCompany 
        ? data.customerInfo.companyName 
        : `${data.customerInfo.firstName || ''} ${data.customerInfo.lastName || ''}`.trim();

      if (customerName) {
        const newCustomer = await createCustomer({
          customer_type: data.customerInfo.customerType,
          name: customerName,
          first_name: isCompany ? null : data.customerInfo.firstName || null,
          last_name: isCompany ? null : data.customerInfo.lastName || null,
          tax_id: isCompany ? data.customerInfo.taxId || null : null,
          contact_person: isCompany ? data.customerInfo.contactPerson || null : null,
          email: data.customerInfo.email || null,
          phone: data.customerInfo.phone || null,
        });
        customerId = newCustomer.id;
      }
    }

    await create({
      invoice: {
        ...data.invoice,
        customer_id: customerId,
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
          customers={customers}
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
