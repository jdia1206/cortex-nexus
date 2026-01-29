-- Create return status enum
DO $$ BEGIN
  CREATE TYPE return_status AS ENUM ('pending', 'inspecting', 'approved', 'rejected', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create transfer status enum
DO $$ BEGIN
  CREATE TYPE transfer_status AS ENUM ('pending', 'in_transit', 'received', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Returns table (linked to sales invoices)
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  return_number TEXT NOT NULL,
  sales_invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id),
  customer_id UUID REFERENCES public.customers(id),
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status return_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  refund_amount NUMERIC DEFAULT 0,
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Return items table
CREATE TABLE public.return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  original_quantity INTEGER NOT NULL DEFAULT 1,
  return_quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  condition TEXT DEFAULT 'good',
  restock BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Returns inventory (separate stock for returned items pending inspection)
CREATE TABLE public.returns_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  warehouse_id UUID REFERENCES public.warehouses(id),
  return_item_id UUID REFERENCES public.return_items(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  condition TEXT DEFAULT 'pending_inspection',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory transfers between warehouses/branches
CREATE TABLE public.inventory_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  transfer_number TEXT NOT NULL,
  source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  destination_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  status transfer_status NOT NULL DEFAULT 'pending',
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_arrival DATE,
  received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transfer items
CREATE TABLE public.transfer_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  transfer_id UUID NOT NULL REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_sent INTEGER NOT NULL DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for returns
CREATE POLICY "Users can view returns" ON public.returns FOR SELECT USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert returns" ON public.returns FOR INSERT WITH CHECK (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update returns" ON public.returns FOR UPDATE USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete returns" ON public.returns FOR DELETE USING (is_admin_of_tenant(tenant_id));

-- RLS Policies for return_items
CREATE POLICY "Users can view return items" ON public.return_items FOR SELECT USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert return items" ON public.return_items FOR INSERT WITH CHECK (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update return items" ON public.return_items FOR UPDATE USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete return items" ON public.return_items FOR DELETE USING (is_admin_of_tenant(tenant_id));

-- RLS Policies for returns_inventory
CREATE POLICY "Users can view returns inventory" ON public.returns_inventory FOR SELECT USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert returns inventory" ON public.returns_inventory FOR INSERT WITH CHECK (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update returns inventory" ON public.returns_inventory FOR UPDATE USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete returns inventory" ON public.returns_inventory FOR DELETE USING (is_admin_of_tenant(tenant_id));

-- RLS Policies for inventory_transfers
CREATE POLICY "Users can view transfers" ON public.inventory_transfers FOR SELECT USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert transfers" ON public.inventory_transfers FOR INSERT WITH CHECK (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update transfers" ON public.inventory_transfers FOR UPDATE USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete transfers" ON public.inventory_transfers FOR DELETE USING (is_admin_of_tenant(tenant_id));

-- RLS Policies for transfer_items
CREATE POLICY "Users can view transfer items" ON public.transfer_items FOR SELECT USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can insert transfer items" ON public.transfer_items FOR INSERT WITH CHECK (is_member_of_tenant(tenant_id));
CREATE POLICY "Users can update transfer items" ON public.transfer_items FOR UPDATE USING (is_member_of_tenant(tenant_id));
CREATE POLICY "Admins can delete transfer items" ON public.transfer_items FOR DELETE USING (is_admin_of_tenant(tenant_id));

-- Add updated_at triggers
CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_returns_inventory_updated_at BEFORE UPDATE ON public.returns_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_transfers_updated_at BEFORE UPDATE ON public.inventory_transfers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();