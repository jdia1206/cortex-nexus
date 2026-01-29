import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, ArrowRight, Package } from 'lucide-react';
import { CreateTransferData } from '@/hooks/useTransfers';

interface Warehouse {
  id: string;
  name: string;
  branch_id: string;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  sku?: string | null;
}

interface TransferItem {
  product_id: string;
  name: string;
  quantity_sent: number;
  available: number;
}

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: Warehouse[];
  products: Product[];
  onSubmit: (data: CreateTransferData) => Promise<unknown>;
  isSubmitting: boolean;
  transfersCount: number;
}

export function TransferFormDialog({
  open,
  onOpenChange,
  warehouses,
  products,
  onSubmit,
  isSubmitting,
  transfersCount,
}: TransferFormDialogProps) {
  const { t } = useTranslation();

  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const addProduct = () => {
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    if (items.some(i => i.product_id === selectedProductId)) return;
    
    setItems(prev => [
      ...prev,
      {
        product_id: product.id,
        name: product.name,
        quantity_sent: 1,
        available: product.quantity,
      },
    ]);
    setSelectedProductId('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.product_id === productId 
        ? { ...item, quantity_sent: Math.min(Math.max(1, quantity), item.available) }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const handleSubmit = async () => {
    if (!sourceWarehouseId || !destinationWarehouseId || items.length === 0) return;

    await onSubmit({
      source_warehouse_id: sourceWarehouseId,
      destination_warehouse_id: destinationWarehouseId,
      expected_arrival: expectedArrival || undefined,
      notes: notes || undefined,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity_sent: item.quantity_sent,
      })),
    });

    resetForm();
  };

  const resetForm = () => {
    onOpenChange(false);
    setSourceWarehouseId('');
    setDestinationWarehouseId('');
    setExpectedArrival('');
    setNotes('');
    setItems([]);
    setSelectedProductId('');
  };

  const availableDestinations = warehouses.filter(w => w.id !== sourceWarehouseId);
  const availableProducts = products.filter(p => !items.some(i => i.product_id === p.id));
  const canSubmit = sourceWarehouseId && destinationWarehouseId && items.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            {t('transfers.newTransfer')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warehouse Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('transfers.source')} *</Label>
              <Select value={sourceWarehouseId} onValueChange={setSourceWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transfers.selectSource')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('transfers.destination')} *</Label>
              <Select 
                value={destinationWarehouseId} 
                onValueChange={setDestinationWarehouseId}
                disabled={!sourceWarehouseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('transfers.selectDestination')} />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expected Arrival */}
          <div className="space-y-2">
            <Label>{t('transfers.expectedArrival')}</Label>
            <Input
              type="date"
              value={expectedArrival}
              onChange={(e) => setExpectedArrival(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <Separator />

          {/* Add Products */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('transfers.addProducts')}
            </Label>
            
            <div className="flex gap-2">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('transfers.selectProduct')} />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({t('transfers.available')}: {product.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addProduct} disabled={!selectedProductId}>
                {t('common.add')}
              </Button>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="border rounded-lg divide-y">
              {items.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('transfers.available')}: {item.available}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">{t('transfers.quantity')}:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={item.available}
                        value={item.quantity_sent}
                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.product_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('transfers.notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('transfers.notesPlaceholder')}
              rows={2}
            />
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-medium">{items.length}</span> {t('transfers.productsToTransfer')}
              </p>
              <p className="text-sm">
                <span className="font-medium">
                  {items.reduce((sum, i) => sum + i.quantity_sent, 0)}
                </span> {t('transfers.totalUnits')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? t('common.saving') : t('transfers.createTransfer')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
