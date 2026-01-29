import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Minus, Package, PlusCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ProductForm } from '@/components/products/ProductForm';

type Product = {
  id: string;
  name: string;
  cost: number;
  price: number;
  tax_rate: number;
  sku?: string | null;
  quantity: number;
  image_url?: string | null;
};

type SelectedProduct = {
  product_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
};

interface PurchaseProductCatalogProps {
  products: Product[];
  selectedProducts: SelectedProduct[];
  onSelectionChange: (products: SelectedProduct[]) => void;
  onCreateProduct?: (data: any) => Promise<void>;
  isCreatingProduct?: boolean;
}

export function PurchaseProductCatalog({ 
  products, 
  selectedProducts, 
  onSelectionChange,
  onCreateProduct,
  isCreatingProduct 
}: PurchaseProductCatalogProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [productFormOpen, setProductFormOpen] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const getSelectedQuantity = (productId: string) => {
    const selected = selectedProducts.find(p => p.product_id === productId);
    return selected?.quantity || 0;
  };

  const updateQuantity = (product: Product, delta: number) => {
    const currentQty = getSelectedQuantity(product.id);
    const newQty = Math.max(0, currentQty + delta);

    if (newQty === 0) {
      onSelectionChange(selectedProducts.filter(p => p.product_id !== product.id));
    } else {
      const existing = selectedProducts.find(p => p.product_id === product.id);
      if (existing) {
        onSelectionChange(selectedProducts.map(p => 
          p.product_id === product.id 
            ? { ...p, quantity: newQty, subtotal: newQty * p.unit_cost }
            : p
        ));
      } else {
        onSelectionChange([...selectedProducts, {
          product_id: product.id,
          name: product.name,
          quantity: newQty,
          unit_cost: Number(product.cost),
          subtotal: newQty * Number(product.cost),
        }]);
      }
    }
  };

  const setQuantity = (product: Product, qty: number) => {
    const newQty = Math.max(0, qty);

    if (newQty === 0) {
      onSelectionChange(selectedProducts.filter(p => p.product_id !== product.id));
    } else {
      const existing = selectedProducts.find(p => p.product_id === product.id);
      if (existing) {
        onSelectionChange(selectedProducts.map(p => 
          p.product_id === product.id 
            ? { ...p, quantity: newQty, subtotal: newQty * p.unit_cost }
            : p
        ));
      } else {
        onSelectionChange([...selectedProducts, {
          product_id: product.id,
          name: product.name,
          quantity: newQty,
          unit_cost: Number(product.cost),
          subtotal: newQty * Number(product.cost),
        }]);
      }
    }
  };

  const handleCreateProduct = async (data: any) => {
    if (onCreateProduct) {
      await onCreateProduct(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('purchases.searchProducts')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {onCreateProduct && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setProductFormOpen(true)}
            className="shrink-0"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('purchases.newProduct')}
          </Button>
        )}
      </div>

      <ScrollArea className="h-[300px] pr-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mb-2" />
            <p>{t('purchases.noProductsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const selectedQty = getSelectedQuantity(product.id);
              const isSelected = selectedQty > 0;

              return (
                <Card 
                  key={product.id} 
                  className={`transition-all cursor-pointer hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3 mb-2">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        )}
                        <Badge variant="secondary" className="mt-1">
                          {formatCurrency(Number(product.cost))}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {t('purchases.currentStock')}: {product.quantity}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(product, -1)}
                          disabled={selectedQty === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          min={0}
                          value={selectedQty}
                          onChange={(e) => setQuantity(product, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center text-sm"
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(product, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {onCreateProduct && (
        <ProductForm
          open={productFormOpen}
          onOpenChange={setProductFormOpen}
          onSubmit={handleCreateProduct}
          isLoading={isCreatingProduct}
        />
      )}
    </div>
  );
}
