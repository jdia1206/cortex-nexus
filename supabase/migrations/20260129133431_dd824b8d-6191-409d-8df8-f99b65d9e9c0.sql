-- Add payment_method column to sales_invoices
ALTER TABLE public.sales_invoices 
ADD COLUMN payment_method TEXT DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.sales_invoices.payment_method IS 'Payment method: cash, card, crypto';