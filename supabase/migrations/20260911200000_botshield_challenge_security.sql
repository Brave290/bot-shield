-- BotShield challenge lifecycle and richer security telemetry.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS allowed_ips TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blocked_ips TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'active' CHECK (mode IN ('active', 'shadow'));

ALTER TABLE public.verification_logs
  ADD COLUMN IF NOT EXISTS score INTEGER,
  ADD COLUMN IF NOT EXISTS bot_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS browser_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS request_id UUID,
  ADD COLUMN IF NOT EXISTS risk_reasons TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS verification_logs_request_id_idx ON public.verification_logs(request_id);
CREATE INDEX IF NOT EXISTS verification_logs_created_at_idx ON public.verification_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.challenge_tokens (
  jti UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  fingerprint TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS challenge_tokens_expiry_idx ON public.challenge_tokens(expires_at);
ALTER TABLE public.challenge_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.challenge_tokens FROM anon, authenticated;

-- Keep old challenge rows from accumulating forever.
CREATE OR REPLACE FUNCTION public.cleanup_expired_challenge_tokens()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  DELETE FROM public.challenge_tokens WHERE expires_at < now() OR used_at < now() - interval '1 day';
$$;
REVOKE ALL ON FUNCTION public.cleanup_expired_challenge_tokens() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_botshield_security_data(p_retention_days integer DEFAULT 90)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  DELETE FROM public.verification_logs
  WHERE created_at < now() - make_interval(days => GREATEST(30, LEAST(p_retention_days, 730)));
  PERFORM public.cleanup_expired_challenge_tokens();
END;
$$;
REVOKE ALL ON FUNCTION public.cleanup_botshield_security_data(integer) FROM PUBLIC, anon, authenticated;
