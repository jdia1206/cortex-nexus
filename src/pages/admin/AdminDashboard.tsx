import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, CreditCard, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [tenantsRes, subscriptionsRes, ticketsRes] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('status', { count: 'exact' }),
        supabase.from('support_tickets').select('status', { count: 'exact' }),
      ]);

      const activeSubscriptions = subscriptionsRes.data?.filter(s => s.status === 'active').length || 0;
      const openTickets = ticketsRes.data?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0;

      return {
        totalTenants: tenantsRes.count || 0,
        activeSubscriptions,
        openTickets,
        totalTickets: ticketsRes.count || 0,
      };
    },
  });

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats?.totalTenants ?? '-',
      description: 'Companies on the platform',
      icon: Building2,
      color: 'text-blue-500',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions ?? '-',
      description: 'Paid active subscriptions',
      icon: CreditCard,
      color: 'text-green-500',
    },
    {
      title: 'Open Tickets',
      value: stats?.openTickets ?? '-',
      description: 'Awaiting resolution',
      icon: MessageSquare,
      color: 'text-orange-500',
    },
    {
      title: 'Total Tickets',
      value: stats?.totalTickets ?? '-',
      description: 'All support tickets',
      icon: AlertCircle,
      color: 'text-purple-500',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Dashboard</h1>
          <p className="text-muted-foreground">Overview of your SaaS platform</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <div className="h-8 w-16 animate-pulse bg-muted rounded" />
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Activity feed coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Quick actions coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
