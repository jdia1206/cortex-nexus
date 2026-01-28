import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  ShoppingCart,
  ShoppingBag,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'paid':
    case 'received':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const statsCards = [
    { 
      key: 'totalSales', 
      icon: ShoppingCart, 
      value: formatCurrency(stats?.totalSales || 0), 
      color: 'text-green-500' 
    },
    { 
      key: 'totalPurchases', 
      icon: ShoppingBag, 
      value: formatCurrency(stats?.totalPurchases || 0), 
      color: 'text-blue-500' 
    },
    { 
      key: 'inventoryValue', 
      icon: Package, 
      value: formatCurrency(stats?.inventoryValue || 0), 
      color: 'text-purple-500' 
    },
    { 
      key: 'lowStock', 
      icon: AlertTriangle, 
      value: String(stats?.lowStockCount || 0), 
      color: stats?.lowStockCount ? 'text-amber-500' : 'text-muted-foreground' 
    },
  ];

  return (
    <AppLayout 
      companyName={tenant?.name} 
      userName={profile?.full_name}
      onLogout={signOut}
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.welcome')}, {profile?.full_name}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(`dashboard.${stat.key}`)}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stat.value
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                {t('dashboard.recentSales')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : stats?.recentSales.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  {t('common.noData')}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{sale.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customer_name || t('sales.customer')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(sale.total)}</p>
                        <Badge variant={getStatusBadgeVariant(sale.status)} className="text-xs">
                          {t(`sales.${sale.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                {t('dashboard.recentPurchases')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : stats?.recentPurchases.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  {t('common.noData')}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.recentPurchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{purchase.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {purchase.supplier_name || t('purchases.supplier')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(purchase.total)}</p>
                        <Badge variant={getStatusBadgeVariant(purchase.status)} className="text-xs">
                          {t(`purchases.${purchase.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('dashboard.topProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : stats?.topProducts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                {t('common.noData')}
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity_sold} {t('inventory.quantity').toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
