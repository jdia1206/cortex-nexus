import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, DeleteDialog, Column } from '@/components/shared';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { Tables } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { Building2, User } from 'lucide-react';

type Customer = Tables<'customers'>;

export default function Customers() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { customers, isLoading, create, update, delete: deleteCustomer, isCreating, isUpdating, isDeleting } = useCustomers();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const columns: Column<Customer>[] = [
    { 
      key: 'name', 
      header: t('customers.name'),
      render: (customer) => (
        <div className="flex items-center gap-2">
          {customer.customer_type === 'company' ? (
            <Building2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{customer.name}</span>
        </div>
      ),
    },
    { 
      key: 'customer_type', 
      header: t('customers.customerType'),
      render: (customer) => (
        <Badge variant={customer.customer_type === 'company' ? 'default' : 'secondary'}>
          {t(`customers.${customer.customer_type}`)}
        </Badge>
      ),
    },
    { key: 'tax_id', header: t('customers.taxId') },
    { key: 'phone', header: t('customers.phone') },
    { key: 'email', header: t('customers.email') },
    { key: 'city', header: t('customers.city') },
  ];

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (selectedCustomer) {
      await update({ id: selectedCustomer.id, ...data });
    } else {
      await create(data);
    }
    setSelectedCustomer(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedCustomer) {
      await deleteCustomer(selectedCustomer.id);
      setDeleteOpen(false);
      setSelectedCustomer(null);
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
          title={t('customers.title')}
          description={t('customers.description')}
          actionLabel={t('customers.add')}
          onAction={() => {
            setSelectedCustomer(null);
            setFormOpen(true);
          }}
        />

        <DataTable
          data={customers}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['name', 'tax_id', 'email']}
          searchPlaceholder={t('customers.searchPlaceholder')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyTitle={t('customers.empty')}
          emptyDescription={t('customers.emptyDescription')}
          emptyAction={t('customers.add')}
          onEmptyAction={() => setFormOpen(true)}
        />

        <CustomerForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleSubmit}
          customer={selectedCustomer}
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
