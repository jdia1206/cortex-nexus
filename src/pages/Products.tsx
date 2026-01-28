import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useProducts } from '@/hooks/useProducts';
import { ProductForm } from '@/components/products/ProductForm';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

export default function Products() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { products, isLoading, create, update, delete: deleteProduct, isCreating, isUpdating, isDeleting } = useProducts();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const columns: Column<Product>[] = [
    { key: 'name', header: t('products.name') },
    { key: 'sku', header: t('products.sku') },
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
      key: 'tax_rate', 
      header: t('products.taxRate'),
      render: (product) => `${Number(product.tax_rate)}%`,
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
        <PageHeader
          title={t('products.title')}
          description={t('products.description')}
          actionLabel={t('products.add')}
          onAction={() => {
            setSelectedProduct(null);
            setFormOpen(true);
          }}
        />

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
          emptyAction={t('products.add')}
          onEmptyAction={() => setFormOpen(true)}
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
