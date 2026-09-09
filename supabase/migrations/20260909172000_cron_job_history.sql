CREATE TABLE IF NOT EXISTS public.cron_job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL DEFAULT 'daily-maintenance',
  triggered_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  duration_ms INTEGER,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cron_job_history_created_at_idx
  ON public.cron_job_history (created_at DESC);

ALTER TABLE public.cron_job_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view cron job history" ON public.cron_job_history;
CREATE POLICY "Admins can view cron job history"
  ON public.cron_job_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.email = auth.jwt() ->> 'email'
  ));

INSERT INTO public.cron_job_history (job_name, triggered_by, status, duration_ms, result, created_at)
SELECT 'daily-maintenance', triggered_by, status, duration_ms, result, created_at
FROM public.ping_history
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ping_history');

DROP TABLE IF EXISTS public.ping_history;
