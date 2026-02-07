import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Banknote,
  CreditCard,
  Bitcoin,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Product = Tables<'products'>;
type Customer = Tables<'customers'>;

export interface CartItem {
  product: Product;
  quantity: number;
}

type PaymentMethod = 'cash' | 'card' | 'crypto';

interface POSCartProps {
  items: CartItem[];
  customers: Customer[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (paymentMethod: PaymentMethod, customerId: string | null, discount: number) => void;
  isSubmitting: boolean;
}

export default function POSCart({
  items,
  customers,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteSale,
  isSubmitting,
}: POSCartProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [customerOpen, setCustomerOpen] = useState(false);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const taxAmount = items.reduce(
    (sum, item) =>
      sum + Number(item.product.price) * item.quantity * (Number(item.product.tax_rate) / 100),
    0
  );

  const total = subtotal + taxAmount - discount;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleComplete = () => {
    if (!paymentMethod || items.length === 0) return;
    onCompleteSale(paymentMethod, selectedCustomerId, discount);
    setPaymentMethod(null);
    setSelectedCustomerId(null);
    setDiscount(0);
  };

  const paymentOptions: { method: PaymentMethod; icon: React.ReactNode; label: string }[] = [
    { method: 'cash', icon: <Banknote className="h-5 w-5" />, label: t('sales.paymentCash') },
    { method: 'card', icon: <CreditCard className="h-5 w-5" />, label: t('sales.paymentCard') },
    { method: 'crypto', icon: <Bitcoin className="h-5 w-5" />, label: t('sales.paymentCrypto') },
  ];

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">{t('pos.cart')}</h2>
          {items.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearCart} className="text-destructive hover:text-destructive">
            {t('pos.clearCart')}
          </Button>
        )}
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4">
            <ShoppingCart className="h-10 w-10 mb-3" />
            <p className="text-sm text-center">{t('sales.emptyCart')}</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(item.product.price))} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      item.quantity <= 1
                        ? onRemoveItem(item.product.id)
                        : onUpdateQuantity(item.product.id, item.quantity - 1)
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.quantity}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(Number(item.product.price) * item.quantity)}
                  </p>
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Checkout Section */}
      <div className="border-t p-4 space-y-4">
        {/* Customer Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{t('pos.quickCustomer')}</Label>
          <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left font-normal h-9"
              >
                <Search className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                {selectedCustomer ? selectedCustomer.name : t('sales.selectCustomer')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[280px]" align="start">
              <Command>
                <CommandInput placeholder={t('sales.searchCustomers')} />
                <CommandList>
                  <CommandEmpty>{t('sales.noCustomersFound')}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="__none__"
                      onSelect={() => {
                        setSelectedCustomerId(null);
                        setCustomerOpen(false);
                      }}
                    >
                      — {t('pos.noCustomer')}
                    </CommandItem>
                    {customers.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerOpen(false);
                        }}
                      >
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('sales.subtotal')}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('sales.tax')}</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t('sales.discount')}</span>
            <Input
              type="number"
              min={0}
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-24 h-7 text-right text-sm"
              placeholder="0.00"
            />
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>{t('sales.total')}</span>
            <span className="text-primary">{formatCurrency(Math.max(0, total))}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{t('sales.paymentMethod')}</Label>
          <div className="grid grid-cols-3 gap-2">
            {paymentOptions.map((opt) => (
              <button
                key={opt.method}
                onClick={() => setPaymentMethod(opt.method)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all text-sm font-medium',
                  paymentMethod === opt.method
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/40'
                )}
              >
                {opt.icon}
                <span className="text-xs">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Complete Sale Button */}
        <Button
          className="w-full h-14 text-lg font-bold"
          size="lg"
          onClick={handleComplete}
          disabled={items.length === 0 || !paymentMethod || isSubmitting}
        >
          {isSubmitting ? t('common.saving') : t('pos.completeSale')}
        </Button>
      </div>
    </div>
  );
}
