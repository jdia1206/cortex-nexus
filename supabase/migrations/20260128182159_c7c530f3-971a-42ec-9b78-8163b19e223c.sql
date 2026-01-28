-- =============================================
-- ONBOARDING FUNCTION: Create tenant with first user
-- Uses SECURITY DEFINER to bypass RLS for initial setup
-- =============================================

CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  p_tenant_name TEXT,
  p_user_id UUID,
  p_full_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Create the tenant
  INSERT INTO public.tenants (name)
  VALUES (p_tenant_name)
  RETURNING id INTO v_tenant_id;

  -- Create the profile linked to the tenant
  INSERT INTO public.profiles (user_id, tenant_id, full_name)
  VALUES (p_user_id, v_tenant_id, p_full_name);

  -- Assign admin role to the user
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (p_user_id, v_tenant_id, 'admin');

  -- Create a default main branch
  INSERT INTO public.branches (tenant_id, name, is_main)
  VALUES (v_tenant_id, 'Main Branch', true);

  RETURN v_tenant_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_tenant_with_admin TO authenticated;

-- =============================================
-- FUNCTION: Add user to tenant (for invitations)
-- =============================================

CREATE OR REPLACE FUNCTION public.add_user_to_tenant(
  p_user_id UUID,
  p_tenant_id UUID,
  p_full_name TEXT,
  p_role app_role DEFAULT 'user'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins of the tenant can add users
  IF NOT public.is_admin_of_tenant(p_tenant_id) THEN
    RAISE EXCEPTION 'Only admins can add users to the tenant';
  END IF;

  -- Create the profile
  INSERT INTO public.profiles (user_id, tenant_id, full_name)
  VALUES (p_user_id, p_tenant_id, p_full_name)
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign role
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (p_user_id, p_tenant_id, p_role)
  ON CONFLICT (user_id, tenant_id, role) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_user_to_tenant TO authenticated;