
CREATE OR REPLACE FUNCTION public.deduct_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET quantity = GREATEST(0, quantity - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;
