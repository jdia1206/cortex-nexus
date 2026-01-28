import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, DataTable, Column } from '@/components/shared';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

type UserWithRole = {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
};

export default function Users() {
  const { t } = useTranslation();
  const { profile, tenant, signOut, userRole } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', profile?.tenant_id],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name')
        .eq('tenant_id', profile!.tenant_id);

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('tenant_id', profile!.tenant_id);

      if (rolesError) throw rolesError;

      return profiles.map((p) => ({
        ...p,
        role: roles.find((r) => r.user_id === p.user_id)?.role || 'user',
      }));
    },
    enabled: !!profile?.tenant_id,
  });

  const columns: Column<UserWithRole>[] = [
    { key: 'full_name', header: t('users.name') },
    { 
      key: 'role', 
      header: t('users.role'),
      render: (user) => (
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {t(`users.${user.role}`)}
        </Badge>
      ),
    },
  ];

  return (
    <AppLayout
      companyName={tenant?.name}
      userName={profile?.full_name}
      onLogout={signOut}
    >
      <div className="space-y-6">
        <PageHeader
          title={t('users.title')}
          description={t('users.description')}
        />

        <DataTable
          data={users}
          columns={columns}
          isLoading={isLoading}
          searchKeys={['full_name']}
          searchPlaceholder={t('users.searchPlaceholder')}
          emptyTitle={t('users.empty')}
          emptyDescription={t('users.emptyDescription')}
        />
      </div>
    </AppLayout>
  );
}
