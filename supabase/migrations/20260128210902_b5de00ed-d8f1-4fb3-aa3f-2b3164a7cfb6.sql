
-- Create enum for platform roles
CREATE TYPE public.platform_role AS ENUM ('super_admin', 'support_agent');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'inactive');

-- Create enum for ticket status
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');

-- Create enum for ticket priority
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create enum for ticket category
CREATE TYPE public.ticket_category AS ENUM ('billing', 'technical', 'feature_request', 'general');

-- Platform admins table (separate from tenant admins)
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role platform_role NOT NULL DEFAULT 'support_agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  max_users INTEGER,
  max_products INTEGER,
  max_branches INTEGER,
  is_active BOOLEAN DEFAULT true,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions table (links tenants to plans)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'inactive',
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  category ticket_category NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Ticket messages table
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform announcements table
CREATE TABLE public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  target_plans UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin audit log table
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Function to check if user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = check_user_id
  )
$$;

-- Function to check if user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = check_user_id AND role = 'super_admin'
  )
$$;

-- RLS Policies for platform_admins
CREATE POLICY "Platform admins can view all admins"
ON public.platform_admins FOR SELECT
USING (is_platform_admin());

CREATE POLICY "Super admins can manage platform admins"
ON public.platform_admins FOR ALL
USING (is_super_admin());

-- RLS Policies for subscription_plans (readable by all authenticated, writable by super admins)
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
TO authenticated
USING (is_active = true OR is_platform_admin());

CREATE POLICY "Super admins can manage plans"
ON public.subscription_plans FOR ALL
USING (is_super_admin());

-- RLS Policies for subscriptions
CREATE POLICY "Tenants can view own subscription"
ON public.subscriptions FOR SELECT
USING (is_member_of_tenant(tenant_id) OR is_platform_admin());

CREATE POLICY "Platform admins can manage subscriptions"
ON public.subscriptions FOR ALL
USING (is_platform_admin());

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
USING (created_by = auth.uid() OR is_platform_admin());

CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Platform admins can manage tickets"
ON public.support_tickets FOR ALL
USING (is_platform_admin());

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages on own tickets"
ON public.ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND (t.created_by = auth.uid() OR is_platform_admin())
  )
  AND (is_internal = false OR is_platform_admin())
);

CREATE POLICY "Users can add messages to own tickets"
ON public.ticket_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.created_by = auth.uid()
  )
  AND is_internal = false
);

CREATE POLICY "Platform admins can manage messages"
ON public.ticket_messages FOR ALL
USING (is_platform_admin());

-- RLS Policies for platform_announcements
CREATE POLICY "Users can view active announcements"
ON public.platform_announcements FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at > now())
  OR is_platform_admin()
);

CREATE POLICY "Platform admins can manage announcements"
ON public.platform_announcements FOR ALL
USING (is_platform_admin());

-- RLS Policies for admin_audit_log
CREATE POLICY "Platform admins can view audit log"
ON public.admin_audit_log FOR SELECT
USING (is_platform_admin());

CREATE POLICY "Platform admins can insert audit log"
ON public.admin_audit_log FOR INSERT
WITH CHECK (is_platform_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_platform_admins_updated_at
BEFORE UPDATE ON public.platform_admins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_announcements_updated_at
BEFORE UPDATE ON public.platform_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, max_users, max_products, max_branches, features) VALUES
('Free', 'Basic plan for small businesses', 0, 0, 2, 100, 1, '["Basic inventory", "Sales tracking", "Email support"]'::jsonb),
('Pro', 'Professional plan for growing businesses', 29, 290, 10, 1000, 5, '["Everything in Free", "Advanced reports", "Priority support", "API access"]'::jsonb),
('Enterprise', 'Full-featured plan for large organizations', 99, 990, NULL, NULL, NULL, '["Everything in Pro", "Unlimited users", "Unlimited products", "Dedicated support", "Custom integrations"]'::jsonb);
