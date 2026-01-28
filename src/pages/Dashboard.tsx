import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShoppingCart,
  ShoppingBag,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

const statsCards = [
  { key: 'totalSales', icon: ShoppingCart, value: '$0', trend: '+0%', color: 'text-success' },
  { key: 'totalPurchases', icon: ShoppingBag, value: '$0', trend: '+0%', color: 'text-primary' },
  { key: 'inventoryValue', icon: Package, value: '$0', trend: '+0%', color: 'text-accent' },
  { key: 'lowStock', icon: AlertTriangle, value: '0', trend: '', color: 'text-warning' },
];

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <AppLayout companyName="Demo Company" userName="Admin User">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
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
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.trend && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    {stat.trend} {t('dashboard.salesOverview')}
                  </p>
                )}
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
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                {t('common.noData')}
              </div>
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
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                {t('common.noData')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              {t('dashboard.topProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {t('common.noData')}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
