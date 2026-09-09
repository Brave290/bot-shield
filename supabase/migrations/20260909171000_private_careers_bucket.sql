UPDATE storage.buckets SET public = false WHERE id = 'careers';

DROP POLICY IF EXISTS "public upload careers" ON storage.objects;
DROP POLICY IF EXISTS "public read careers" ON storage.objects;
DROP POLICY IF EXISTS "public insert applications" ON public.job_applications;
DROP POLICY IF EXISTS "service read applications" ON public.job_applications;
