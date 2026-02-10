import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { SelectWithCreate } from '@/components/shared/SelectWithCreate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, ShoppingCart, Truck, Loader2 } from 'lucide-react';
import { PurchaseProductCatalog } from './PurchaseProductCatalog';
import { useCurrency } from '@/contexts/CurrencyContext';

type Product = {
  id: string;
  name: string;
  cost: number;
  price: number;
  tax_rate: number;
  sku?: string | null;
  quantity: number;
};

type Supplier = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

type Warehouse = {
  id: string;
  name: string;
  address?: string | null;
};

type SelectedProduct = {
  product_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
};

interface PurchasesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onSubmit: (data: {
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
  }) => Promise<void>;
  onCreateProduct?: (data: any) => Promise<void>;
  onCreateSupplier?: (name: string) => Promise<any>;
  isSubmitting: boolean;
  isCreatingProduct?: boolean;
  isCreatingSupplier?: boolean;
  purchasesCount: number;
}

function generatePONumber(count: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = (count + 1).toString().padStart(4, '0');
  return `PO-${year}${month}${day}-${sequence}`;
}

export function PurchasesFormDialog({
  open,
  onOpenChange,
  products,
  suppliers,
  warehouses,
  onSubmit,
  onCreateProduct,
  onCreateSupplier,
  isSubmitting,
  isCreatingProduct,
  isCreatingSupplier,
  purchasesCount,
}: PurchasesFormDialogProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const [poNumber, setPONumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [notes, setNotes] = useState('');

  // Generate PO number when dialog opens
  useEffect(() => {
    if (open) {
      setPONumber(generatePONumber(purchasesCount));
    }
  }, [open, purchasesCount]);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);

  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((sum, item) => sum + item.subtotal, 0);
    return { subtotal, total: subtotal };
  };

  const { subtotal, total } = calculateTotals();

  const handleSubmit = async () => {
    await onSubmit({
      invoice: {
        invoice_number: poNumber,
        supplier_id: supplierId || null,
        warehouse_id: warehouseId || null,
        notes: notes || null,
        subtotal,
        tax_amount: 0,
        total,
      },
      items: selectedProducts.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        subtotal: item.subtotal,
      })),
    });

    resetForm();
  };

  const resetForm = () => {
    onOpenChange(false);
    setSupplierId('');
    setWarehouseId('');
    setSelectedProducts([]);
    setNotes('');
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.product_id !== productId));
  };

  const canSubmit = poNumber && warehouseId && selectedProducts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {t('purchases.newPurchase')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Supplier, Warehouse & Products */}
          <div className="space-y-6">
            {/* PO Number */}
            <div className="space-y-2">
              <Label>{t('purchases.poNumber')}</Label>
              <Input
                value={poNumber}
                readOnly
                className="bg-muted font-mono"
              />
            </div>

            {/* Supplier Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">{t('purchases.supplierInfo')}</Label>
              </div>
              <SelectWithCreate
                value={supplierId}
                onValueChange={setSupplierId}
                placeholder={t('purchases.selectSupplier')}
                items={suppliers.map(s => ({ id: s.id, name: s.name }))}
                onCreateNew={async (name) => {
                  if (onCreateSupplier) {
                    return await onCreateSupplier(name);
                  }
                }}
                isCreating={isCreatingSupplier}
                createLabel={t('suppliers.add')}
                createPlaceholder={t('suppliers.namePlaceholder')}
              />
              
              {selectedSupplier && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  {selectedSupplier.email && (
                    <p className="text-muted-foreground">{selectedSupplier.email}</p>
                  )}
                  {selectedSupplier.phone && (
                    <p className="text-muted-foreground">{selectedSupplier.phone}</p>
                  )}
                  {selectedSupplier.address && (
                    <p className="text-muted-foreground">{selectedSupplier.address}</p>
                  )}
                </div>
              )}
            </div>

            {/* Warehouse Selection */}
            <div className="space-y-2">
              <Label>{t('purchases.warehouse')} *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('purchases.selectWarehouse')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Product Catalog */}
            <div className="space-y-2">
              <Label className="text-base font-medium">{t('purchases.selectProducts')}</Label>
              <PurchaseProductCatalog
                products={products}
                selectedProducts={selectedProducts}
                onSelectionChange={setSelectedProducts}
                onCreateProduct={onCreateProduct}
                isCreatingProduct={isCreatingProduct}
              />
            </div>
          </div>

          {/* Right Column - Cart & Summary */}
          <div className="space-y-6">
            {/* Selected Items */}
            <div className="space-y-2">
              <Label className="text-base font-medium">
                {t('purchases.cart')} ({selectedProducts.length})
              </Label>
              <div className="border rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                {selectedProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('purchases.emptyCart')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.unit_cost)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {formatCurrency(item.subtotal)}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeProduct(item.product_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{t('purchases.notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('purchases.notesPlaceholder')}
              />
            </div>

            {/* Totals */}
            <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('purchases.subtotal')}:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t('purchases.total')}:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('purchases.completePurchase')
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
