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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RotateCcw, Package, Search } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { CreateReturnData } from '@/hooks/useReturns';

interface SalesInvoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customers?: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  tax_rate: number;
}

interface ReturnItem {
  product_id: string;
  name: string;
  original_quantity: number;
  return_quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
}

interface ReturnFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sales: SalesInvoice[];
  products: Product[];
  onSubmit: (data: CreateReturnData) => Promise<unknown>;
  isSubmitting: boolean;
  returnsCount: number;
}

export function ReturnFormDialog({
  open,
  onOpenChange,
  sales,
  products,
  onSubmit,
  isSubmitting,
  returnsCount,
}: ReturnFormDialogProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [saleItems, setSaleItems] = useState<ReturnItem[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState('');

  // Filter sales by receipt number search
  const filteredSales = receiptSearch.trim()
    ? sales.filter(s => 
        s.invoice_number && 
        s.invoice_number.toLowerCase().includes(receiptSearch.toLowerCase().trim())
      )
    : sales;

  // Load sale items when sale is selected
  useEffect(() => {
    if (selectedSaleId) {
      loadSaleItems(selectedSaleId);
    } else {
      setSaleItems([]);
      setReturnItems([]);
    }
  }, [selectedSaleId]);

  const loadSaleItems = async (saleId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_invoice_items')
        .select('*, products(name)')
        .eq('invoice_id', saleId);
      
      if (error) throw error;
      
      const items: ReturnItem[] = (data || []).map((item: any) => ({
        product_id: item.product_id,
        name: item.products?.name || 'Unknown Product',
        original_quantity: item.quantity,
        return_quantity: 0,
        unit_price: Number(item.unit_price),
        tax_rate: Number(item.tax_rate),
        subtotal: 0,
      }));
      
      setSaleItems(items);
    } catch (error) {
      console.error('Error loading sale items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const item = saleItems.find(i => i.product_id === productId);
    if (!item) return;

    const validQty = Math.min(Math.max(0, quantity), item.original_quantity);
    
    setReturnItems(prev => {
      const existing = prev.find(i => i.product_id === productId);
      if (validQty === 0) {
        return prev.filter(i => i.product_id !== productId);
      }
      
      const newItem: ReturnItem = {
        ...item,
        return_quantity: validQty,
        subtotal: validQty * item.unit_price,
      };
      
      if (existing) {
        return prev.map(i => i.product_id === productId ? newItem : i);
      }
      return [...prev, newItem];
    });
  };

  const calculateTotals = () => {
    const subtotal = returnItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = returnItems.reduce(
      (sum, item) => sum + (item.subtotal * item.tax_rate / 100),
      0
    );
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const selectedSale = sales.find(s => s.id === selectedSaleId);

  const handleSubmit = async () => {
    if (!selectedSale || returnItems.length === 0) return;

    await onSubmit({
      sales_invoice_id: selectedSaleId,
      customer_id: selectedSale.customer_id,
      reason: reason || null,
      notes: notes || null,
      subtotal,
      tax_amount: taxAmount,
      total,
      items: returnItems.map(item => ({
        product_id: item.product_id,
        original_quantity: item.original_quantity,
        return_quantity: item.return_quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        subtotal: item.subtotal,
        condition: 'pending_inspection',
        restock: false,
      })),
    });

    resetForm();
  };

  const resetForm = () => {
    onOpenChange(false);
    setSelectedSaleId('');
    setSaleItems([]);
    setReturnItems([]);
    setReason('');
    setNotes('');
    setReceiptSearch('');
  };

  const canSubmit = selectedSaleId && returnItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            {t('returns.newReturn')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select Sale */}
          <div className="space-y-2">
            <Label>{t('returns.selectSale')} *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                placeholder={t('returns.searchReceipt')}
                className="pl-9"
              />
            </div>
            
            {/* Live search results - only show when searching */}
            {receiptSearch.trim() && (
              <>
                <div className="border rounded-lg max-h-48 overflow-y-auto bg-background">
                  {filteredSales.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {t('returns.noSalesFound')}
                    </div>
                  ) : (
                    filteredSales.slice(0, 10).map((sale) => (
                      <button
                        key={sale.id}
                        type="button"
                        onClick={() => {
                          setSelectedSaleId(sale.id);
                          setReceiptSearch(sale.invoice_number);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                          selectedSaleId === sale.id ? 'bg-primary/10 text-primary' : ''
                        }`}
                      >
                        <span className="font-medium">{sale.invoice_number}</span>
                        <span className="text-muted-foreground ml-2">
                          - {sale.customers?.name || t('returns.noCustomer')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                {filteredSales.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {t('returns.showingFirst', { count: 10 })} of {filteredSales.length}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Sale Items */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : saleItems.length > 0 ? (
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('returns.selectItems')}
              </Label>
              <div className="border rounded-lg divide-y">
                {saleItems.map((item) => {
                  const returnItem = returnItems.find(i => i.product_id === item.product_id);
                  return (
                    <div key={item.product_id} className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('returns.purchased')}: {item.original_quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">{t('returns.returnQty')}:</Label>
                          <Input
                            type="number"
                            min={0}
                            max={item.original_quantity}
                            value={returnItem?.return_quantity || 0}
                            onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">/ {item.original_quantity}</span>
                        </div>
                        {returnItem && returnItem.return_quantity > 0 && (
                          <Badge variant="outline">
                            {formatCurrency(returnItem.subtotal)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedSaleId ? (
            <p className="text-center py-8 text-muted-foreground">
              {t('returns.noItems')}
            </p>
          ) : null}

          <Separator />

          {/* Reason */}
          <div className="space-y-2">
            <Label>{t('returns.reason')}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('returns.reasonPlaceholder')}
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('returns.notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('returns.notesPlaceholder')}
              rows={2}
            />
          </div>

          {/* Summary */}
          {returnItems.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('returns.subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('returns.tax')}</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{t('returns.total')}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? t('common.saving') : t('returns.processReturn')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
