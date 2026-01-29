import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { useAuditLog, AuditAction, AuditEntityType } from '@/hooks/useAuditLog';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '@/components/shared/EmptyState';

const ACTIONS: AuditAction[] = ['create', 'update', 'delete', 'mark_paid', 'approve', 'receive', 'cancel'];
const ENTITIES: AuditEntityType[] = ['sale', 'purchase', 'product', 'customer', 'supplier', 'return', 'transfer', 'inventory', 'branch', 'warehouse', 'user'];

const actionColors: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  mark_paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  approve: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  receive: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  cancel: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export default function ActivityLog() {
  const { t } = useTranslation();
  const { userRole } = useAuth();
  const { logs, isLoading } = useAuditLog();
  
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = !search || log.user_name.toLowerCase().includes(search.toLowerCase());
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, search, actionFilter, entityFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(page * pageSize, (page + 1) * pageSize);

  const formatDetails = (details: unknown) => {
    if (!details || typeof details !== 'object') return '-';
    const obj = details as Record<string, unknown>;
    const entries = Object.entries(obj).slice(0, 3);
    if (entries.length === 0) return '-';
    return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
  };

  // Redirect non-admin users
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('activityLog.title')}
          description={t('activityLog.description')}
        />

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder={t('activityLog.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('activityLog.filterByAction')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('activityLog.allActions')}</SelectItem>
                {ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(0); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('activityLog.filterByEntity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('activityLog.allEntities')}</SelectItem>
                {ENTITIES.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : paginatedLogs.length === 0 ? (
            <EmptyState
              title={t('activityLog.empty')}
              description={t('activityLog.emptyDescription')}
            />
          ) : (
            <>
              {/* Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{t('activityLog.user')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('activityLog.action')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('activityLog.entity')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('activityLog.details')}</TableHead>
                      <TableHead className="whitespace-nowrap">{t('activityLog.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.user_name}</TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action as AuditAction] || ''} variant="secondary">
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{log.entity_type}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {formatDetails(log.details)}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground text-center sm:text-left">
                    {t('common.showing')} {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filteredLogs.length)} {t('common.of')} {filteredLogs.length}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center text-sm text-muted-foreground px-2">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
