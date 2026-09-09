CREATE TABLE IF NOT EXISTS public.ping_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  duration_ms INTEGER,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ping_history_created_at_idx
  ON public.ping_history (created_at DESC);

ALTER TABLE public.ping_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view ping history" ON public.ping_history;
CREATE POLICY "Admins can view ping history"
  ON public.ping_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.email = auth.jwt() ->> 'email'
  ));
