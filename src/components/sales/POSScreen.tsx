import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useProductCategories } from '@/hooks/useProductCategories';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, CheckCircle } from 'lucide-react';
import POSProductGrid from './POSProductGrid';
import POSCart, { CartItem } from './POSCart';

type Product = Tables<'products'>;

interface POSScreenProps {
  onSwitchToAdmin?: () => void;
}

export default function POSScreen({ onSwitchToAdmin }: POSScreenProps) {
  const { t } = useTranslation();
  const { profile, signOut, userRole } = useAuth();
  const { create, isCreating, sales } = useSales();
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { categories } = useProductCategories();
  const { formatCurrency } = useCurrency();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [saleComplete, setSaleComplete] = useState<string | null>(null);

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error(t('pos.maxStock'));
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, [t]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const generateReceiptNumber = () => {
    const date = new Date();
    const prefix = 'RCP';
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const seq = String(sales.length + 1).padStart(4, '0');
    return `${prefix}-${dateStr}-${seq}`;
  };

  const handleCompleteSale = async (
    paymentMethod: 'cash' | 'card' | 'crypto',
    customerId: string | null,
    discount: number
  ) => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );
    const taxAmount = cartItems.reduce(
      (sum, item) =>
        sum + Number(item.product.price) * item.quantity * (Number(item.product.tax_rate) / 100),
      0
    );
    const total = subtotal + taxAmount - discount;
    const invoiceNumber = generateReceiptNumber();

    try {
      await create({
        invoice: {
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          customer_id: customerId,
          status: 'paid',
          payment_method: paymentMethod,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discount,
          total: Math.max(0, total),
          notes: null,
        },
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: Number(item.product.price),
          tax_rate: Number(item.product.tax_rate),
          subtotal: Number(item.product.price) * item.quantity,
        })),
      });

      setSaleComplete(invoiceNumber);
      setCartItems([]);
    } catch {
      // Error is handled by useSales hook
    }
  };

  // Success screen after sale
  if (saleComplete) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('pos.saleComplete')}</h1>
            <p className="text-muted-foreground mt-1">{saleComplete}</p>
          </div>
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold"
            onClick={() => setSaleComplete(null)}
          >
            {t('pos.newSale')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-40 flex flex-col">
      {/* Minimal Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary">{t('pos.title')}</h1>
          <span className="text-sm text-muted-foreground">
            {profile?.full_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'admin' && onSwitchToAdmin && (
            <Button variant="outline" size="sm" onClick={onSwitchToAdmin}>
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              {t('pos.viewAllSales')}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} title={t('auth.logout')}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Product Grid - Left */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0 lg:min-h-full">
          <POSProductGrid
            products={products}
            categories={categories}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Cart - Right */}
        <div className="lg:w-[380px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l overflow-hidden flex flex-col">
          <POSCart
            items={cartItems}
            customers={customers}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCompleteSale={handleCompleteSale}
            isSubmitting={isCreating}
          />
        </div>
      </div>
    </div>
  );
}
