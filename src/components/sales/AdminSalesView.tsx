import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SalesFormDialog } from '@/components/sales/SalesFormDialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Download, CreditCard, Banknote, Bitcoin, CheckCircle2 } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdf/reportGenerator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SalesInvoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  payment_method: string | null;
  customers: { name: string } | null;
};

type PaymentMethod = 'cash' | 'card' | 'crypto';

interface AdminSalesViewProps {
  onSwitchToPOS?: () => void;
}

export default function AdminSalesView({ onSwitchToPOS }: AdminSalesViewProps) {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { sales, isLoading, create, update, delete: deleteSale, isCreating, isUpdating, isDeleting } = useSales();
  const { products } = useProducts();
  const { customers, create: createCustomer } = useCustomers();
  const { formatCurrency, currency } = useCurrency();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SalesInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

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
      key: 'actions',
      header: '',
      render: (sale) => (
        <div className="flex items-center gap-1">
          {sale.status === 'pending' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsPaid(sale);
              }}
              title={t('sales.markAsPaid')}
            >
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </Button>
          )}
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
        </div>
      ),
    },
  ];

  const handleDelete = (sale: SalesInvoice) => {
    setSelectedSale(sale);
    setDeleteOpen(true);
  };

  const handleMarkAsPaid = (sale: SalesInvoice) => {
    setSelectedSale(sale);
    setPaymentMethod('');
    setMarkPaidOpen(true);
  };

  const handleConfirmMarkPaid = async () => {
    if (selectedSale && paymentMethod) {
      await update({ id: selectedSale.id, status: 'paid', payment_method: paymentMethod });
      setMarkPaidOpen(false);
      setSelectedSale(null);
      setPaymentMethod('');
    }
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
      status: string;
      payment_method: string | null;
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
          extra={
            onSwitchToPOS && (
              <Button variant="outline" onClick={onSwitchToPOS}>
                {t('pos.openPOS')}
              </Button>
            )
          }
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

        {/* Mark as Paid Dialog */}
        <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('sales.markAsPaid')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('sales.paymentMethod')}</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('sales.selectPaymentMethod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        {t('sales.paymentCash')}
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {t('sales.paymentCard')}
                      </div>
                    </SelectItem>
                    <SelectItem value="crypto">
                      <div className="flex items-center gap-2">
                        <Bitcoin className="h-4 w-4" />
                        {t('sales.paymentCrypto')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleConfirmMarkPaid} disabled={!paymentMethod || isUpdating}>
                {t('common.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
