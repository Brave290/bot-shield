-- Atomic rate limiting and billing webhook replay protection.
CREATE UNIQUE INDEX IF NOT EXISTS billing_events_provider_event_id_key
  ON public.billing_events(provider, event_id);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(p_limit_id text, p_scope_key text)
RETURNS TABLE(allowed boolean, remaining integer, reset_in_seconds integer, rate_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  cfg record;
  attempts integer;
  oldest timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_limit_id || ':' || p_scope_key));
  SELECT * INTO cfg FROM public.rate_limits WHERE id = p_limit_id AND enabled = true LIMIT 1;
  IF cfg IS NULL THEN
    RETURN QUERY SELECT true, 2147483647, 0, 2147483647;
    RETURN;
  END IF;
  SELECT COUNT(*)::integer, MIN(created_at) INTO attempts, oldest
  FROM public.rate_limit_events
  WHERE limit_id = p_limit_id
    AND scope_key = p_scope_key
    AND created_at >= now() - make_interval(secs => cfg.window_seconds);
  IF attempts >= cfg.max_attempts THEN
    RETURN QUERY SELECT false, 0, GREATEST(0, CEIL(EXTRACT(EPOCH FROM (oldest + make_interval(secs => cfg.window_seconds) - now())))::integer), cfg.max_attempts;
    RETURN;
  END IF;
  INSERT INTO public.rate_limit_events(limit_id, scope_key) VALUES (p_limit_id, p_scope_key);
  RETURN QUERY SELECT true, GREATEST(0, cfg.max_attempts - attempts - 1), 0, cfg.max_attempts;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text) FROM PUBLIC, anon, authenticated;
