import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useBranches } from '@/hooks/useBranches';
import { BranchForm } from '@/components/settings/BranchForm';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';

type Branch = Tables<'branches'>;

export default function Branches() {
  const { t } = useTranslation();
  const { profile, tenant, signOut, userRole } = useAuth();
  const { branches, isLoading, create, update, delete: deleteBranch, isCreating, isUpdating, isDeleting } = useBranches();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const isAdmin = userRole === 'admin';

  const columns: Column<Branch>[] = [
    { key: 'name', header: t('branches.name') },
    { key: 'manager_name', header: t('branches.manager') },
    { key: 'phone', header: t('branches.phone') },
    { key: 'address', header: t('branches.address') },
    { 
      key: 'is_main', 
      header: t('branches.type'),
      render: (branch) => (
        <Badge variant={branch.is_main ? 'default' : 'secondary'}>
          {branch.is_main ? t('branches.main') : t('branches.branch')}
        </Badge>
      ),
    },
  ];

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormOpen(true);
  };

  const handleDelete = (branch: Branch) => {
    setSelectedBranch(branch);
    setDeleteOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (selectedBranch) {
      await update({ id: selectedBranch.id, ...data });
    } else {
      await create(data);
    }
    setSelectedBranch(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedBranch) {
      await deleteBranch(selectedBranch.id);
      setDeleteOpen(false);
      setSelectedBranch(null);
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
          title={t('branches.title')}
          description={t('branches.description')}
          actionLabel={isAdmin ? t('branches.add') : undefined}
          onAction={isAdmin ? () => {
            setSelectedBranch(null);
            setFormOpen(true);
          } : undefined}
        />

        <DataTable
          data={branches}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['name', 'manager_name']}
          searchPlaceholder={t('branches.searchPlaceholder')}
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
          emptyTitle={t('branches.empty')}
          emptyDescription={t('branches.emptyDescription')}
        />

        <BranchForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          branch={selectedBranch}
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
