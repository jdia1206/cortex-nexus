import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useProducts } from '@/hooks/useProducts';
import { useProductCategories } from '@/hooks/useProductCategories';
import { ProductForm } from '@/components/products/ProductForm';
import { CategoryManager } from '@/components/products/CategoryManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

export default function Products() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { products, isLoading, create, update, delete: deleteProduct, isCreating, isUpdating, isDeleting } = useProducts();
  const { categories } = useProductCategories();

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  };

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const columns: Column<Product>[] = [
    { key: 'name', header: t('products.name') },
    { key: 'sku', header: t('products.sku') },
    { 
      key: 'category_id', 
      header: t('products.category'),
      render: (product) => getCategoryName(product.category_id),
    },
    { key: 'quantity', header: t('products.quantity') },
    { 
      key: 'cost', 
      header: t('products.cost'),
      render: (product) => `$${Number(product.cost).toFixed(2)}`,
    },
    { 
      key: 'price', 
      header: t('products.price'),
      render: (product) => `$${Number(product.price).toFixed(2)}`,
    },
    { 
      key: 'is_active', 
      header: t('products.status'),
      render: (product) => (
        <Badge variant={product.is_active ? 'default' : 'secondary'}>
          {product.is_active ? t('products.active') : t('products.inactive')}
        </Badge>
      ),
    },
  ];

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (selectedProduct) {
      await update({ id: selectedProduct.id, ...data });
    } else {
      await create(data);
    }
    setSelectedProduct(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      await deleteProduct(selectedProduct.id);
      setDeleteOpen(false);
      setSelectedProduct(null);
    }
  };

  return (
    <AppLayout
      companyName={tenant?.name}
      userName={profile?.full_name}
      onLogout={signOut}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title={t('products.title')}
            description={t('products.description')}
          />
          <div className="flex gap-2">
            <CategoryManager />
            <Button onClick={() => { setSelectedProduct(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('products.add')}
            </Button>
          </div>
        </div>

        <DataTable
          data={products}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['name', 'sku']}
          searchPlaceholder={t('products.searchPlaceholder')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyTitle={t('products.empty')}
          emptyDescription={t('products.emptyDescription')}
        />

        <ProductForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          product={selectedProduct}
          isLoading={isCreating || isUpdating}
        />

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
