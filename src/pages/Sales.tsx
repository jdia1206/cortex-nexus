import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useSales } from '@/hooks/useSales';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

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

type LineItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
};

export default function Sales() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { sales, isLoading, create, delete: deleteSale, isCreating, isDeleting } = useSales();
  const { customers } = useCustomers();
  const { products } = useProducts();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SalesInvoice | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([]);

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
      render: (sale) => `$${Number(sale.total).toFixed(2)}`,
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

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, tax_rate: 0, subtotal: 0 }]);
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = Number(product.price);
        newItems[index].tax_rate = Number(product.tax_rate);
      }
    }
    
    newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_price;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.subtotal * item.tax_rate / 100), 0);
    const total = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async () => {
    const { subtotal, taxAmount, total } = calculateTotals();
    await create({
      invoice: {
        invoice_number: invoiceNumber,
        customer_id: customerId || null,
        notes,
        discount_amount: discount,
        subtotal,
        tax_amount: taxAmount,
        total,
      },
      items: items.map(item => ({
        product_id: item.product_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        subtotal: item.subtotal,
      })),
    });
    resetForm();
  };

  const resetForm = () => {
    setFormOpen(false);
    setInvoiceNumber('');
    setCustomerId('');
    setNotes('');
    setDiscount(0);
    setItems([]);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

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

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('sales.add')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('sales.invoiceNumber')} *</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('sales.customer')}</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('sales.selectCustomer')} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('sales.items')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('sales.addItem')}
                  </Button>
                </div>
                <div className="border rounded-lg p-4 space-y-4">
                  {items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      {t('sales.noItems')}
                    </p>
                  ) : (
                    items.map((item, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 items-end">
                        <div className="col-span-2">
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateItem(index, 'product_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('sales.selectProduct')} />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          min={1}
                        />
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                          step="0.01"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('sales.notes')}</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('sales.discount')}</Label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      step="0.01"
                    />
                  </div>
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('sales.subtotal')}:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('sales.tax')}:</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('sales.discount')}:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t('sales.total')}:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit} disabled={isCreating || !invoiceNumber || items.length === 0}>
                  {isCreating ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
