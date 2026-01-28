import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useBranches } from '@/hooks/useBranches';
import { WarehouseForm } from '@/components/settings/WarehouseForm';
import { Tables } from '@/integrations/supabase/types';

type Warehouse = Tables<'warehouses'> & { branches?: { name: string } | null };

export default function Warehouses() {
  const { t } = useTranslation();
  const { profile, tenant, signOut, userRole } = useAuth();
  const { warehouses, isLoading, create, update, delete: deleteWarehouse, isCreating, isUpdating, isDeleting } = useWarehouses();
  const { branches } = useBranches();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const isAdmin = userRole === 'admin';

  const columns: Column<Warehouse>[] = [
    { key: 'name', header: t('warehouses.name') },
    { 
      key: 'branch', 
      header: t('warehouses.branch'),
      render: (warehouse) => warehouse.branches?.name || '-',
    },
    { key: 'capacity', header: t('warehouses.capacity') },
    { key: 'address', header: t('warehouses.address') },
  ];

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleDelete = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDeleteOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (selectedWarehouse) {
      await update({ id: selectedWarehouse.id, ...data });
    } else {
      await create(data);
    }
    setSelectedWarehouse(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedWarehouse) {
      await deleteWarehouse(selectedWarehouse.id);
      setDeleteOpen(false);
      setSelectedWarehouse(null);
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
          title={t('warehouses.title')}
          description={t('warehouses.description')}
          actionLabel={isAdmin ? t('warehouses.add') : undefined}
          onAction={isAdmin ? () => {
            setSelectedWarehouse(null);
            setFormOpen(true);
          } : undefined}
        />

        <DataTable
          data={warehouses as Warehouse[]}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['name']}
          searchPlaceholder={t('warehouses.searchPlaceholder')}
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
          emptyTitle={t('warehouses.empty')}
          emptyDescription={t('warehouses.emptyDescription')}
        />

        <WarehouseForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          warehouse={selectedWarehouse}
          branches={branches}
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
