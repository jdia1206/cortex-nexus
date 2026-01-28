-- Add customer_type column to distinguish between person and company
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'company' CHECK (customer_type IN ('person', 'company'));

-- Add first_name and last_name columns for person customers
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;