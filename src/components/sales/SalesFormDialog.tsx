import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ShoppingCart, User, Mail, Loader2, Building2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCatalog } from './ProductCatalog';
import { CustomerSelector } from './CustomerSelector';
import { Tables } from '@/integrations/supabase/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  price: number;
  tax_rate: number;
  sku?: string | null;
  quantity: number;
};

type SelectedProduct = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
};

interface CustomerInfo {
  customerType: 'person' | 'company';
  // Company fields
  companyName: string;
  taxId: string;
  contactPerson: string;
  // Person fields
  firstName: string;
  lastName: string;
  // Common fields
  email: string;
  phone: string;
}

type Customer = Tables<'customers'>;

interface SalesFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  customers: Customer[];
  onSubmit: (data: {
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
    customerInfo: CustomerInfo;
  }) => Promise<void>;
  isSubmitting: boolean;
  salesCount: number;
}

function generateReceiptNumber(count: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = (count + 1).toString().padStart(4, '0');
  return `RCP-${year}${month}${day}-${sequence}`;
}

export function SalesFormDialog({
  open,
  onOpenChange,
  products,
  customers,
  onSubmit,
  isSubmitting,
  salesCount,
}: SalesFormDialogProps) {
  const { t } = useTranslation();
  const { formatCurrency, currency } = useCurrency();
  const { tenant } = useAuth();

  const [receiptNumber, setReceiptNumber] = useState('');
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    customerType: 'person',
    companyName: '',
    taxId: '',
    contactPerson: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [sendReceiptEmail, setSendReceiptEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Generate receipt number when dialog opens
  useEffect(() => {
    if (open) {
      setReceiptNumber(generateReceiptNumber(salesCount));
    }
  }, [open, salesCount]);

  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = selectedProducts.reduce(
      (sum, item) => sum + (item.subtotal * item.tax_rate / 100), 
      0
    );
    const total = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  // Get email for receipt sending (from selected customer or manual input)
  const getEmailForReceipt = () => {
    if (customerMode === 'existing' && selectedCustomer) {
      return selectedCustomer.email || customerInfo.email;
    }
    return customerInfo.email;
  };

  const getCustomerName = () => {
    if (customerMode === 'existing' && selectedCustomer) {
      return selectedCustomer.name;
    }
    return customerInfo.customerType === 'company' 
      ? customerInfo.companyName || 'Customer'
      : `${customerInfo.firstName} ${customerInfo.lastName}`.trim() || 'Customer';
  };

  const sendReceiptEmailToCustomer = async () => {
    const email = getEmailForReceipt();
    if (!email) return;
    
    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-receipt-email', {
        body: {
          to_email: email,
          receipt_number: receiptNumber,
          receipt_date: new Date().toLocaleDateString(),
          customer_name: getCustomerName(),
          customer_email: email,
          customer_phone: selectedCustomer?.phone || customerInfo.phone,
          company_name: tenant?.name || 'Company',
          company_email: tenant?.email,
          company_phone: tenant?.phone,
          company_address: tenant?.address,
          items: selectedProducts.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            subtotal: item.subtotal,
          })),
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discount,
          total,
          currency_symbol: currency,
          notes,
        },
      });

      if (error) throw error;
      toast.success(t('sales.receiptSent'));
    } catch (error) {
      console.error('Failed to send receipt email:', error);
      toast.error(t('sales.receiptSendError'));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSubmit = async () => {
    await onSubmit({
      invoice: {
        invoice_number: receiptNumber,
        customer_id: customerMode === 'existing' && selectedCustomer ? selectedCustomer.id : null,
        notes: notes || null,
        discount_amount: discount,
        subtotal,
        tax_amount: taxAmount,
        total,
      },
      items: selectedProducts.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        subtotal: item.subtotal,
      })),
      customerInfo,
    });

    // Send receipt email if checkbox is checked and email is provided
    const email = getEmailForReceipt();
    if (sendReceiptEmail && email) {
      await sendReceiptEmailToCustomer();
    }

    resetForm();
  };

  const resetForm = () => {
    onOpenChange(false);
    setCustomerMode('existing');
    setSelectedCustomer(null);
    setCustomerInfo({
      customerType: 'person',
      companyName: '',
      taxId: '',
      contactPerson: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
    setSelectedProducts([]);
    setNotes('');
    setDiscount(0);
    setSendReceiptEmail(false);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.product_id !== productId));
  };

  const canSubmit = receiptNumber && selectedProducts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('sales.newSale')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Customer & Products */}
          <div className="space-y-6">
            {/* Receipt Number */}
            <div className="space-y-2">
              <Label>{t('sales.receiptNumber')}</Label>
              <Input
                value={receiptNumber}
                readOnly
                className="bg-muted font-mono"
              />
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">{t('sales.customerInfo')}</Label>
              </div>
              
              <Tabs value={customerMode} onValueChange={(v) => {
                setCustomerMode(v as 'existing' | 'new');
                if (v === 'new') {
                  setSelectedCustomer(null);
                }
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">{t('sales.existingCustomer')}</TabsTrigger>
                  <TabsTrigger value="new">{t('sales.newCustomer')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="existing" className="mt-4">
                  <CustomerSelector
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    onSelect={(customer) => {
                      setSelectedCustomer(customer);
                      if (customer) {
                        // Pre-fill email for receipt sending
                        setCustomerInfo(prev => ({
                          ...prev,
                          email: customer.email || '',
                          phone: customer.phone || '',
                        }));
                      }
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="new" className="mt-4 space-y-4">
                  {/* Customer Type Selector */}
                  <RadioGroup
                    value={customerInfo.customerType}
                    onValueChange={(value: 'person' | 'company') => 
                      setCustomerInfo({ ...customerInfo, customerType: value })
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="person" id="sale-person" />
                      <Label htmlFor="sale-person" className="flex items-center gap-1 cursor-pointer">
                        <User className="h-4 w-4" />
                        {t('customers.person')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="company" id="sale-company" />
                      <Label htmlFor="sale-company" className="flex items-center gap-1 cursor-pointer">
                        <Building2 className="h-4 w-4" />
                        {t('customers.company')}
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="grid grid-cols-2 gap-3">
                    {customerInfo.customerType === 'company' ? (
                      <>
                        {/* Company Fields */}
                        <div className="space-y-2 col-span-2">
                          <Label className="text-sm">{t('customers.companyName')}</Label>
                          <Input
                            value={customerInfo.companyName}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, companyName: e.target.value })}
                            placeholder={t('customers.companyNamePlaceholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{t('customers.taxId')}</Label>
                          <Input
                            value={customerInfo.taxId}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, taxId: e.target.value })}
                            placeholder={t('customers.taxIdPlaceholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{t('customers.contactPerson')}</Label>
                          <Input
                            value={customerInfo.contactPerson}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, contactPerson: e.target.value })}
                            placeholder={t('customers.contactPersonPlaceholder')}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Person Fields */}
                        <div className="space-y-2">
                          <Label className="text-sm">{t('sales.firstName')}</Label>
                          <Input
                            value={customerInfo.firstName}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                            placeholder={t('sales.firstNamePlaceholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{t('sales.lastName')}</Label>
                          <Input
                            value={customerInfo.lastName}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                            placeholder={t('sales.lastNamePlaceholder')}
                          />
                        </div>
                      </>
                    )}
                    
                    {/* Common Fields */}
                    <div className="space-y-2">
                      <Label className="text-sm">{t('sales.email')}</Label>
                      <Input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        placeholder={t('sales.emailPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">{t('sales.phone')}</Label>
                      <Input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        placeholder={t('sales.phonePlaceholder')}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Separator />

            {/* Product Catalog */}
            <div className="space-y-2">
              <Label className="text-base font-medium">{t('sales.selectProducts')}</Label>
              <ProductCatalog
                products={products}
                selectedProducts={selectedProducts}
                onSelectionChange={setSelectedProducts}
              />
            </div>
          </div>

          {/* Right Column - Cart & Summary */}
          <div className="space-y-6">
            {/* Selected Items */}
            <div className="space-y-2">
              <Label className="text-base font-medium">
                {t('sales.cart')} ({selectedProducts.length})
              </Label>
              <div className="border rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                {selectedProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('sales.emptyCart')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map((item) => (
                      <div key={item.product_id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.unit_price)}
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
              <Label>{t('sales.notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('sales.notesPlaceholder')}
              />
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label>{t('sales.discount')}</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                step="0.01"
                min="0"
              />
            </div>

            {/* Totals */}
            <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('sales.subtotal')}:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('sales.tax')}:</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>{t('sales.discount')}:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t('sales.total')}:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Send Receipt Email Checkbox */}
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="sendReceiptEmail"
                checked={sendReceiptEmail}
                onCheckedChange={(checked) => setSendReceiptEmail(checked === true)}
                disabled={!getEmailForReceipt()}
              />
              <Label 
                htmlFor="sendReceiptEmail" 
                className={`flex items-center gap-2 text-sm cursor-pointer ${!getEmailForReceipt() ? 'text-muted-foreground' : ''}`}
              >
                <Mail className="h-4 w-4" />
                {t('sales.sendReceiptEmail')}
              </Label>
            </div>
            {sendReceiptEmail && !getEmailForReceipt() && (
              <p className="text-xs text-destructive">{t('sales.emailRequired')}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || isSendingEmail || !canSubmit}
              >
                {isSubmitting || isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSendingEmail ? t('sales.sendingReceipt') : t('common.saving')}
                  </>
                ) : (
                  t('sales.completeSale')
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
