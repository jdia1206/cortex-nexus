import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Check } from 'lucide-react';

export default function Billing() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();

  return (
    <AppLayout
      companyName={tenant?.name}
      userName={profile?.full_name}
      onLogout={signOut}
    >
      <div className="space-y-6">
        <PageHeader
          title={t('billing.title')}
          description={t('billing.description')}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('billing.currentPlan')}
              </CardTitle>
              <CardDescription>{t('billing.planDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('billing.freePlan')}</span>
                  <span className="text-2xl font-bold">$0</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    {t('billing.feature1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    {t('billing.feature2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    {t('billing.feature3')}
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('billing.upgradePlan')}</CardTitle>
              <CardDescription>{t('billing.upgradeDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                {t('billing.comingSoon')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
