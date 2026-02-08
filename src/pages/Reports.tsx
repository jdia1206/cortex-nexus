import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared';
import { useSales } from '@/hooks/useSales';
import { usePurchases } from '@/hooks/usePurchases';
import { useReturns } from '@/hooks/useReturns';
import { useTransfers } from '@/hooks/useTransfers';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, ShoppingCart, ShoppingBag, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { generateReport } from '@/lib/pdf/reportGenerator';
import { useLogoDataUrl } from '@/hooks/useLogoDataUrl';
import { format, parseISO } from 'date-fns';

export default function Reports() {
  const { t } = useTranslation();
  const { profile, tenant, signOut } = useAuth();
  const { sales } = useSales();
  const { purchases } = usePurchases();
  const { returns } = useReturns();
  const { transfers } = useTransfers();
  const { formatCurrency, currency } = useCurrency();
  const logoDataUrl = useLogoDataUrl();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  const companyInfo = {
    name: tenant?.name || 'Company',
    address: tenant?.address || undefined,
    phone: tenant?.phone || undefined,
    email: tenant?.email || undefined,
    taxId: tenant?.tax_id || undefined,
  };

  const filterByDate = <T extends { invoice_date?: string; return_date?: string; transfer_date?: string }>(
    items: T[],
    dateField: keyof T
  ) => {
    return items.filter(item => {
      const date = item[dateField] as string;
      if (!date) return false;
      return date >= dateFrom && date <= dateTo;
    });
  };

  const generateSalesReport = () => {
    const filteredSales = filterByDate(sales as any[], 'invoice_date');
    const totalAmount = filteredSales.reduce((sum, s) => sum + Number(s.total), 0);
    const paidTotal = filteredSales.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.total), 0);

    const doc = generateReport(
      {
        title: t('reports.salesReport'),
        subtitle: t('reports.salesSummary'),
        company: companyInfo,
        dateRange: { from: dateFrom, to: dateTo },
        currency: currency.symbol,
      },
      {
        columns: [
          { header: t('sales.invoiceNumber'), dataKey: 'invoice_number' },
          { header: t('sales.customer'), dataKey: 'customer' },
          { header: t('sales.date'), dataKey: 'date' },
          { header: t('sales.status'), dataKey: 'status' },
          { header: t('sales.total'), dataKey: 'total' },
        ],
        rows: filteredSales.map(s => ({
          invoice_number: s.invoice_number,
          customer: s.customers?.name || '-',
          date: s.invoice_date,
          status: t(`sales.${s.status}`),
          total: `${currency.symbol}${Number(s.total).toFixed(2)}`,
        })),
        totals: {
          [t('reports.totalSales')]: totalAmount,
          [t('reports.paidAmount')]: paidTotal,
        },
      },
      logoDataUrl || undefined
    );
    doc.save(`sales-report-${dateFrom}-to-${dateTo}.pdf`);
  };

  const generatePurchasesReport = () => {
    const filteredPurchases = filterByDate(purchases as any[], 'invoice_date');
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + Number(p.total), 0);

    const doc = generateReport(
      {
        title: t('reports.purchasesReport'),
        subtitle: t('reports.purchasesSummary'),
        company: companyInfo,
        dateRange: { from: dateFrom, to: dateTo },
        currency: currency.symbol,
      },
      {
        columns: [
          { header: t('purchases.invoiceNumber'), dataKey: 'invoice_number' },
          { header: t('purchases.supplier'), dataKey: 'supplier' },
          { header: t('purchases.date'), dataKey: 'date' },
          { header: t('purchases.status'), dataKey: 'status' },
          { header: t('purchases.total'), dataKey: 'total' },
        ],
        rows: filteredPurchases.map(p => ({
          invoice_number: p.invoice_number,
          supplier: p.suppliers?.name || '-',
          date: p.invoice_date,
          status: t(`purchases.${p.status}`),
          total: `${currency.symbol}${Number(p.total).toFixed(2)}`,
        })),
        totals: {
          [t('reports.totalPurchases')]: totalAmount,
        },
      },
      logoDataUrl || undefined
    );
    doc.save(`purchases-report-${dateFrom}-to-${dateTo}.pdf`);
  };

  const generateReturnsReport = () => {
    const filteredReturns = filterByDate(returns as any[], 'return_date');
    const totalAmount = filteredReturns.reduce((sum, r) => sum + Number(r.total), 0);
    const refundedAmount = filteredReturns.reduce((sum, r) => sum + Number(r.refund_amount || 0), 0);

    const doc = generateReport(
      {
        title: t('reports.returnsReport'),
        subtitle: t('reports.returnsSummary'),
        company: companyInfo,
        dateRange: { from: dateFrom, to: dateTo },
        currency: currency.symbol,
      },
      {
        columns: [
          { header: t('returns.returnNumber'), dataKey: 'return_number' },
          { header: t('returns.customer'), dataKey: 'customer' },
          { header: t('returns.date'), dataKey: 'date' },
          { header: t('returns.status'), dataKey: 'status' },
          { header: t('returns.total'), dataKey: 'total' },
        ],
        rows: filteredReturns.map(r => ({
          return_number: r.return_number,
          customer: r.customers?.name || '-',
          date: r.return_date,
          status: t(`returns.${r.status}`),
          total: `${currency.symbol}${Number(r.total).toFixed(2)}`,
        })),
        totals: {
          [t('reports.totalReturns')]: totalAmount,
          [t('reports.refundedAmount')]: refundedAmount,
        },
      },
      logoDataUrl || undefined
    );
    doc.save(`returns-report-${dateFrom}-to-${dateTo}.pdf`);
  };

  const generateTransfersReport = () => {
    const filteredTransfers = filterByDate(transfers as any[], 'transfer_date');

    const doc = generateReport(
      {
        title: t('reports.transfersReport'),
        subtitle: t('reports.transfersSummary'),
        company: companyInfo,
        dateRange: { from: dateFrom, to: dateTo },
        currency: currency.symbol,
      },
      {
        columns: [
          { header: t('transfers.transferNumber'), dataKey: 'transfer_number' },
          { header: t('transfers.source'), dataKey: 'source' },
          { header: t('transfers.destination'), dataKey: 'destination' },
          { header: t('transfers.date'), dataKey: 'date' },
          { header: t('transfers.status'), dataKey: 'status' },
        ],
        rows: filteredTransfers.map(tr => ({
          transfer_number: tr.transfer_number,
          source: tr.source_warehouse?.name || '-',
          destination: tr.destination_warehouse?.name || '-',
          date: tr.transfer_date,
          status: t(`transfers.${tr.status}`),
        })),
      },
      logoDataUrl || undefined
    );
    doc.save(`transfers-report-${dateFrom}-to-${dateTo}.pdf`);
  };

  const reportCards = [
    {
      title: t('reports.salesReport'),
      description: t('reports.salesReportDesc'),
      icon: ShoppingCart,
      color: 'text-primary',
      action: generateSalesReport,
    },
    {
      title: t('reports.purchasesReport'),
      description: t('reports.purchasesReportDesc'),
      icon: ShoppingBag,
      color: 'text-primary',
      action: generatePurchasesReport,
    },
    {
      title: t('reports.returnsReport'),
      description: t('reports.returnsReportDesc'),
      icon: RotateCcw,
      color: 'text-primary',
      action: generateReturnsReport,
    },
    {
      title: t('reports.transfersReport'),
      description: t('reports.transfersReportDesc'),
      icon: ArrowRightLeft,
      color: 'text-primary',
      action: generateTransfersReport,
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
          title={t('reports.title')}
          description={t('reports.description')}
        />

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('reports.dateRange')}</CardTitle>
            <CardDescription>{t('reports.dateRangeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label>{t('reports.from')}</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('reports.to')}</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom}
                  max={today}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {reportCards.map((report) => (
            <Card key={report.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={report.action} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  {t('reports.downloadPDF')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
