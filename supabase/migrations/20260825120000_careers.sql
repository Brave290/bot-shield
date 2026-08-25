INSERT INTO storage.buckets (id, name, public) VALUES ('careers','careers', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "public upload careers" ON storage.objects FOR INSERT WITH CHECK (bucket_id='careers');
CREATE POLICY "public read careers" ON storage.objects FOR SELECT USING (bucket_id='careers');

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
  portfolio TEXT, note TEXT, cv_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public insert applications" ON public.job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "service read applications" ON public.job_applications FOR SELECT USING (true);
