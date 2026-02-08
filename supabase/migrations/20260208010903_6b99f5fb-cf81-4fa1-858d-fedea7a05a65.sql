-- Create storage bucket for tenant logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true);

-- Allow authenticated users to upload logos to their tenant's folder
CREATE POLICY "Tenant members can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Allow authenticated users to update logos in their tenant's folder
CREATE POLICY "Tenant members can update logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Allow authenticated users to delete logos in their tenant's folder
CREATE POLICY "Tenant members can delete logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-logos'
  AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);

-- Allow public read access (logos appear on receipts/PDFs)
CREATE POLICY "Tenant logos are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tenant-logos');