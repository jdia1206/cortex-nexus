import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useTransfers } from '@/hooks/useTransfers';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useProducts } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TransferFormDialog } from '@/components/transfers/TransferFormDialog';
import { CheckCircle, Truck, X } from 'lucide-react';

type Transfer = {
  id: string;
  transfer_number: string;
  transfer_date: string;
  expected_arrival: string | null;
  status: string;
  notes: string | null;
  source_warehouse: { name: string; branches: { name: string } | null } | null;
  destination_warehouse: { name: string; branches: { name: string } | null } | null;
};

export default function Transfers() {
  const { t } = useTranslation();
  const { profile, tenant, signOut, user } = useAuth();
  const { transfers, isLoading, create, updateStatus, delete: deleteTransfer, isCreating, isDeleting } = useTransfers();
  const { warehouses } = useWarehouses();
  const { products } = useProducts();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const statusVariant = (status: string) => {
    switch (status) {
      case 'received': return 'default';
      case 'in_transit': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const handleApprove = async (tr: Transfer, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateStatus({ id: tr.id, status: 'in_transit', approved_by: user?.id });
  };

  const handleReceive = async (tr: Transfer, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateStatus({ id: tr.id, status: 'received' });
  };

  const handleCancel = async (tr: Transfer, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateStatus({ id: tr.id, status: 'cancelled' });
  };

  const columns: Column<Transfer>[] = [
    { key: 'transfer_number', header: t('transfers.transferNumber') },
    { 
      key: 'source', 
      header: t('transfers.source'),
      render: (tr) => tr.source_warehouse 
        ? `${tr.source_warehouse.name} (${tr.source_warehouse.branches?.name || ''})` 
        : '-',
    },
    { 
      key: 'destination', 
      header: t('transfers.destination'),
      render: (tr) => tr.destination_warehouse 
        ? `${tr.destination_warehouse.name} (${tr.destination_warehouse.branches?.name || ''})` 
        : '-',
    },
    { key: 'transfer_date', header: t('transfers.date') },
    { 
      key: 'expected_arrival', 
      header: t('transfers.expectedArrival'),
      render: (tr) => tr.expected_arrival || '-',
    },
    { 
      key: 'status', 
      header: t('transfers.status'),
      render: (tr) => (
        <Badge variant={statusVariant(tr.status)}>
          {t(`transfers.${tr.status}`)}
        </Badge>
      ),
    },
    {
      key: 'actions_col',
      header: '',
      render: (tr) => (
        <div className="flex gap-1">
          {tr.status === 'pending' && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => handleApprove(tr, e)}
                title={t('transfers.approve')}
              >
                <Truck className="h-4 w-4 text-primary" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => handleCancel(tr, e)}
                title={t('common.cancel')}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
          {tr.status === 'in_transit' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => handleReceive(tr, e)}
              title={t('transfers.markReceived')}
            >
              <CheckCircle className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleDelete = (tr: Transfer) => {
    setSelectedTransfer(tr);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedTransfer) {
      await deleteTransfer(selectedTransfer.id);
      setDeleteOpen(false);
      setSelectedTransfer(null);
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
          title={t('transfers.title')}
          description={t('transfers.description')}
          actionLabel={t('transfers.add')}
          onAction={() => setFormOpen(true)}
        />

        <DataTable
          data={transfers as Transfer[]}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['transfer_number']}
          searchPlaceholder={t('transfers.searchPlaceholder')}
          onDelete={handleDelete}
          emptyTitle={t('transfers.empty')}
          emptyDescription={t('transfers.emptyDescription')}
          emptyAction={t('transfers.add')}
          onEmptyAction={() => setFormOpen(true)}
        />

        <TransferFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          warehouses={warehouses}
          products={products}
          onSubmit={create}
          isSubmitting={isCreating}
          transfersCount={transfers.length}
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
