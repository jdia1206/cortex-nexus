import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tables } from '@/integrations/supabase/types';
import { ProductCategory } from '@/hooks/useProductCategories';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

type Product = Tables<'products'>;

interface POSProductGridProps {
  products: Product[];
  categories: ProductCategory[];
  onAddToCart: (product: Product) => void;
}

export default function POSProductGrid({ products, categories, onAddToCart }: POSProductGridProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.is_active) return false;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t('pos.searchProducts')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            !selectedCategory
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          {t('pos.allCategories')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mb-3" />
            <p className="text-base">{t('pos.noProductsInCategory')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const outOfStock = product.quantity <= 0;
              return (
                <button
                  key={product.id}
                  onClick={() => !outOfStock && onAddToCart(product)}
                  disabled={outOfStock}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                    'hover:shadow-md hover:border-primary/50 active:scale-[0.97]',
                    outOfStock && 'opacity-40 cursor-not-allowed hover:shadow-none hover:border-border'
                  )}
                >
                  {/* Product Image or Icon */}
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Name */}
                  <span className="text-sm font-medium leading-tight line-clamp-2">
                    {product.name}
                  </span>

                  {/* Price */}
                  <span className="text-base font-bold text-primary">
                    {formatCurrency(Number(product.price))}
                  </span>

                  {/* Stock Badge */}
                  <Badge
                    variant={outOfStock ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {outOfStock ? t('pos.outOfStock') : `${product.quantity} ${t('pos.inStock')}`}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
