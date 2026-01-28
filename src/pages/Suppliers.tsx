import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useSuppliers } from '@/hooks/useSuppliers';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { Tables } from '@/integrations/supabase/types';

type Supplier = Tables<'suppliers'>;

export default function Suppliers() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { suppliers, isLoading, create, update, delete: deleteSupplier, isCreating, isUpdating, isDeleting } = useSuppliers();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const columns: Column<Supplier>[] = [
    { key: 'name', header: t('suppliers.name') },
    { key: 'tax_id', header: t('suppliers.taxId') },
    { key: 'phone', header: t('suppliers.phone') },
    { key: 'email', header: t('suppliers.email') },
    { key: 'representative', header: t('suppliers.representative') },
  ];

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDeleteOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (selectedSupplier) {
      await update({ id: selectedSupplier.id, ...data });
    } else {
      await create(data);
    }
    setSelectedSupplier(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedSupplier) {
      await deleteSupplier(selectedSupplier.id);
      setDeleteOpen(false);
      setSelectedSupplier(null);
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
          title={t('suppliers.title')}
          description={t('suppliers.description')}
          actionLabel={t('suppliers.add')}
          onAction={() => {
            setSelectedSupplier(null);
            setFormOpen(true);
          }}
        />

        <DataTable
          data={suppliers}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['name', 'tax_id']}
          searchPlaceholder={t('suppliers.searchPlaceholder')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyTitle={t('suppliers.empty')}
          emptyDescription={t('suppliers.emptyDescription')}
          emptyAction={t('suppliers.add')}
          onEmptyAction={() => setFormOpen(true)}
        />

        <SupplierForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          supplier={selectedSupplier}
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
