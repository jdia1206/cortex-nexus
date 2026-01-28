import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { usePurchases } from '@/hooks/usePurchases';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
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

type LineItem = {
  product_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
};

export default function Purchases() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { purchases, isLoading, create, delete: deletePurchase, isCreating, isDeleting } = usePurchases();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { warehouses } = useWarehouses();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseInvoice | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);

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
      render: (purchase) => `$${Number(purchase.total).toFixed(2)}`,
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

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_cost: 0, subtotal: 0 }]);
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_cost = Number(product.cost);
      }
    }
    
    newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_cost;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    return { subtotal, total: subtotal };
  };

  const handleSubmit = async () => {
    const { subtotal, total } = calculateTotals();
    await create({
      invoice: {
        invoice_number: invoiceNumber,
        supplier_id: supplierId || null,
        warehouse_id: warehouseId || null,
        notes,
        subtotal,
        tax_amount: 0,
        total,
      },
      items: items.map(item => ({
        product_id: item.product_id || null,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        subtotal: item.subtotal,
      })),
    });
    resetForm();
  };

  const resetForm = () => {
    setFormOpen(false);
    setInvoiceNumber('');
    setSupplierId('');
    setWarehouseId('');
    setNotes('');
    setItems([]);
  };

  const { subtotal, total } = calculateTotals();

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

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('purchases.add')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('purchases.invoiceNumber')} *</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="PO-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('purchases.supplier')}</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('purchases.selectSupplier')} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('purchases.warehouse')}</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('purchases.selectWarehouse')} />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('purchases.items')}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('purchases.addItem')}
                  </Button>
                </div>
                <div className="border rounded-lg p-4 space-y-4">
                  {items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      {t('purchases.noItems')}
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
                              <SelectValue placeholder={t('purchases.selectProduct')} />
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
                          value={item.unit_cost}
                          onChange={(e) => updateItem(index, 'unit_cost', Number(e.target.value))}
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
                  <Label>{t('purchases.notes')}</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-4">
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('purchases.subtotal')}:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t('purchases.total')}:</span>
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
