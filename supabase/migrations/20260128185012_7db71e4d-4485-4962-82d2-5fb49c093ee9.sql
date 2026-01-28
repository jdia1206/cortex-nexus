-- Create product_categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id to products table
ALTER TABLE public.products 
ADD COLUMN category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_categories
CREATE POLICY "Users can view categories" 
ON public.product_categories 
FOR SELECT 
USING (is_member_of_tenant(tenant_id));

CREATE POLICY "Users can insert categories" 
ON public.product_categories 
FOR INSERT 
WITH CHECK (is_member_of_tenant(tenant_id));

CREATE POLICY "Users can update categories" 
ON public.product_categories 
FOR UPDATE 
USING (is_member_of_tenant(tenant_id));

CREATE POLICY "Admins can delete categories" 
ON public.product_categories 
FOR DELETE 
USING (is_admin_of_tenant(tenant_id));

-- Create index for better query performance
CREATE INDEX idx_product_categories_tenant ON public.product_categories(tenant_id);
CREATE INDEX idx_products_category ON public.products(category_id);