
-- Create user_login_sessions table
CREATE TABLE public.user_login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  tenant_id uuid REFERENCES public.tenants(id),
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  logged_out_at timestamptz,
  ip_address text,
  user_agent text,
  browser text,
  os text,
  device_type text,
  country text,
  city text
);

-- Enable RLS
ALTER TABLE public.user_login_sessions ENABLE ROW LEVEL SECURITY;

-- Platform admins can SELECT all sessions
CREATE POLICY "Platform admins can view all login sessions"
ON public.user_login_sessions
FOR SELECT
USING (is_platform_admin());

-- Authenticated users can INSERT their own session
CREATE POLICY "Users can insert own login session"
ON public.user_login_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Platform admins can UPDATE (for logging logout time)
CREATE POLICY "Platform admins can update login sessions"
ON public.user_login_sessions
FOR UPDATE
USING (is_platform_admin());

-- Users can update their own session (for logout tracking)
CREATE POLICY "Users can update own login session"
ON public.user_login_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_login_sessions_user_id ON public.user_login_sessions(user_id);
CREATE INDEX idx_user_login_sessions_tenant_id ON public.user_login_sessions(tenant_id);
CREATE INDEX idx_user_login_sessions_logged_in_at ON public.user_login_sessions(logged_in_at);
