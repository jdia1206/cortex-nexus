import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export type AuditAction = 'create' | 'update' | 'delete' | 'mark_paid' | 'approve' | 'receive' | 'cancel';
export type AuditEntityType = 'sale' | 'purchase' | 'product' | 'customer' | 'supplier' | 'return' | 'transfer' | 'inventory' | 'branch' | 'warehouse' | 'user';

interface AuditLogEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Json;
  created_at: string;
}

interface LogAuditParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  details?: Record<string, string | number | boolean | null>;
}

export function useAuditLog() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('tenant_audit_log')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!profile?.tenant_id,
  });

  const logMutation = useMutation({
    mutationFn: async ({ action, entityType, entityId, details = {} }: LogAuditParams) => {
      if (!profile?.tenant_id || !profile?.user_id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('tenant_audit_log')
        .insert([{
          tenant_id: profile.tenant_id,
          user_id: profile.user_id,
          user_name: profile.full_name,
          action,
          entity_type: entityType,
          entity_id: entityId || null,
          details: (details || {}) as Json,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs', profile?.tenant_id] });
    },
  });

  const logAction = async (params: LogAuditParams) => {
    try {
      await logMutation.mutateAsync(params);
    } catch (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw - audit logging should not break the main flow
    }
  };

  return {
    logs,
    isLoading,
    refetch,
    logAction,
    isLogging: logMutation.isPending,
  };
}
