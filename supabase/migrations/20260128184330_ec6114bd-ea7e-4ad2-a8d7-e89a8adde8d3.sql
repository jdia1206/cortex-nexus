-- Add quantity and custom_fields columns to products table
ALTER TABLE public.products 
ADD COLUMN quantity integer NOT NULL DEFAULT 0,
ADD COLUMN custom_fields jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.products.custom_fields IS 'Array of custom field objects: [{name: string, value: string}]';