-- Create tenant audit log table for tracking all user transactions
CREATE TABLE public.tenant_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenant_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view logs in their tenant
CREATE POLICY "Users can view tenant logs"
ON public.tenant_audit_log
FOR SELECT
USING (is_member_of_tenant(tenant_id));

-- Users can insert logs (for tracking their own actions)
CREATE POLICY "Users can insert logs"
ON public.tenant_audit_log
FOR INSERT
WITH CHECK (is_member_of_tenant(tenant_id));

-- NO DELETE OR UPDATE POLICIES - logs are immutable

-- Create indexes for efficient querying
CREATE INDEX idx_tenant_audit_log_tenant_id ON public.tenant_audit_log(tenant_id);
CREATE INDEX idx_tenant_audit_log_user_id ON public.tenant_audit_log(user_id);
CREATE INDEX idx_tenant_audit_log_entity_type ON public.tenant_audit_log(entity_type);
CREATE INDEX idx_tenant_audit_log_created_at ON public.tenant_audit_log(created_at DESC);

COMMENT ON TABLE public.tenant_audit_log IS 'Immutable audit log for all tenant transactions - no updates or deletes allowed';