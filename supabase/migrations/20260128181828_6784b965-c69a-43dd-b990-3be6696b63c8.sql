-- =============================================
-- VentaSaaS Multi-Tenant Database Schema
-- =============================================

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create tenants table (companies)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create profiles table (users linked to tenants)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id, role)
);

-- 5. Create branches table (sucursales)
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_name TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create warehouses table (depositos)
CREATE TABLE public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create products table (articulos)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  size TEXT,
  cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  has_serial_tracking BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  min_stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, product_id)
);

-- 9. Create customers table (clientes)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  contact_person TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Create suppliers table (proveedores)
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  representative TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Create sales invoices table (facturas de venta)
CREATE TABLE public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Create sales invoice items table
CREATE TABLE public.sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.sales_invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  serial_numbers TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Create purchase invoices table (facturas de compra)
CREATE TABLE public.purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Create purchase invoice items table
CREATE TABLE public.purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  serial_numbers TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- HELPER FUNCTIONS (Security Definer)
-- =============================================

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Check if user is member of a tenant
CREATE OR REPLACE FUNCTION public.is_member_of_tenant(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND tenant_id = target_tenant_id
  )
$$;

-- Check if user has a specific role in a tenant
CREATE OR REPLACE FUNCTION public.has_role_in_tenant(target_tenant_id UUID, target_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
      AND tenant_id = target_tenant_id 
      AND role = target_role
  )
$$;

-- Check if user is admin of a tenant
CREATE OR REPLACE FUNCTION public.is_admin_of_tenant(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role_in_tenant(target_tenant_id, 'admin')
$$;

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_invoices_updated_at BEFORE UPDATE ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_invoices_updated_at BEFORE UPDATE ON public.purchase_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- TENANTS: Users can only see their own tenant
CREATE POLICY "Users can view own tenant" ON public.tenants FOR SELECT TO authenticated USING (public.is_member_of_tenant(id));
CREATE POLICY "Admins can update own tenant" ON public.tenants FOR UPDATE TO authenticated USING (public.is_admin_of_tenant(id));

-- PROFILES: Users can see profiles in their tenant
CREATE POLICY "Users can view profiles in tenant" ON public.profiles FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin_of_tenant(tenant_id) OR user_id = auth.uid());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id) AND user_id != auth.uid());

-- USER_ROLES: Tenant-scoped with admin control
CREATE POLICY "Users can view roles in tenant" ON public.user_roles FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin_of_tenant(tenant_id));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin_of_tenant(tenant_id));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id) AND user_id != auth.uid());

-- BRANCHES: Tenant-scoped
CREATE POLICY "Users can view branches" ON public.branches FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert branches" ON public.branches FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update branches" ON public.branches FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete branches" ON public.branches FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- WAREHOUSES: Tenant-scoped
CREATE POLICY "Users can view warehouses" ON public.warehouses FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert warehouses" ON public.warehouses FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update warehouses" ON public.warehouses FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete warehouses" ON public.warehouses FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- PRODUCTS: Tenant-scoped
CREATE POLICY "Users can view products" ON public.products FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update products" ON public.products FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- INVENTORY: Tenant-scoped
CREATE POLICY "Users can view inventory" ON public.inventory FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert inventory" ON public.inventory FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update inventory" ON public.inventory FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete inventory" ON public.inventory FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- CUSTOMERS: Tenant-scoped
CREATE POLICY "Users can view customers" ON public.customers FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update customers" ON public.customers FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete customers" ON public.customers FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- SUPPLIERS: Tenant-scoped
CREATE POLICY "Users can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- SALES INVOICES: Tenant-scoped
CREATE POLICY "Users can view sales invoices" ON public.sales_invoices FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert sales invoices" ON public.sales_invoices FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update sales invoices" ON public.sales_invoices FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete sales invoices" ON public.sales_invoices FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- SALES INVOICE ITEMS: Tenant-scoped
CREATE POLICY "Users can view sales invoice items" ON public.sales_invoice_items FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert sales invoice items" ON public.sales_invoice_items FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update sales invoice items" ON public.sales_invoice_items FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete sales invoice items" ON public.sales_invoice_items FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- PURCHASE INVOICES: Tenant-scoped
CREATE POLICY "Users can view purchase invoices" ON public.purchase_invoices FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert purchase invoices" ON public.purchase_invoices FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update purchase invoices" ON public.purchase_invoices FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete purchase invoices" ON public.purchase_invoices FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- PURCHASE INVOICE ITEMS: Tenant-scoped
CREATE POLICY "Users can view purchase invoice items" ON public.purchase_invoice_items FOR SELECT TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert purchase invoice items" ON public.purchase_invoice_items FOR INSERT TO authenticated WITH CHECK (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update purchase invoice items" ON public.purchase_invoice_items FOR UPDATE TO authenticated USING (public.is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete purchase invoice items" ON public.purchase_invoice_items FOR DELETE TO authenticated USING (public.is_admin_of_tenant(tenant_id));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX idx_branches_tenant_id ON public.branches(tenant_id);
CREATE INDEX idx_warehouses_tenant_id ON public.warehouses(tenant_id);
CREATE INDEX idx_warehouses_branch_id ON public.warehouses(branch_id);
CREATE INDEX idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX idx_inventory_tenant_id ON public.inventory(tenant_id);
CREATE INDEX idx_inventory_warehouse_id ON public.inventory(warehouse_id);
CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX idx_suppliers_tenant_id ON public.suppliers(tenant_id);
CREATE INDEX idx_sales_invoices_tenant_id ON public.sales_invoices(tenant_id);
CREATE INDEX idx_sales_invoices_customer_id ON public.sales_invoices(customer_id);
CREATE INDEX idx_sales_invoice_items_invoice_id ON public.sales_invoice_items(invoice_id);
CREATE INDEX idx_purchase_invoices_tenant_id ON public.purchase_invoices(tenant_id);
CREATE INDEX idx_purchase_invoices_supplier_id ON public.purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoice_items_invoice_id ON public.purchase_invoice_items(invoice_id);