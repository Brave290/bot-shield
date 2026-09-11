-- Harden the exposed Supabase data plane.
-- The application uses the server-side service-role client for these operations.

-- Remove broad public policies from server-owned or sensitive data.
DROP POLICY IF EXISTS "system all events" ON public.rate_limit_events;
DROP POLICY IF EXISTS "Public can view request metrics" ON public.request_metrics;
DROP POLICY IF EXISTS "Service role can update metrics" ON public.request_metrics;
DROP POLICY IF EXISTS "auth read audit" ON public.audit_logs;
DROP POLICY IF EXISTS "system insert audit" ON public.audit_logs;
DROP POLICY IF EXISTS "system insert logs" ON public.verification_logs;
DROP POLICY IF EXISTS "owner read logs" ON public.verification_logs;
DROP POLICY IF EXISTS "Public can view daily visitor counts" ON public.unique_daily_visitors;
DROP POLICY IF EXISTS "System can insert visitors" ON public.unique_daily_visitors;
DROP POLICY IF EXISTS "public read limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Public can view subscription stats" ON public.subscription_stats;
DROP POLICY IF EXISTS "users manage own subscription" ON public.subscription_stats;

-- Make the intended service-role-only boundary explicit.
REVOKE ALL ON public.rate_limit_events FROM anon, authenticated;
REVOKE ALL ON public.request_metrics FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
REVOKE ALL ON public.verification_logs FROM anon, authenticated;
REVOKE ALL ON public.unique_daily_visitors FROM anon, authenticated;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
REVOKE ALL ON public.subscription_stats FROM anon, authenticated;

-- Elevated RPCs are called only by the server-side client, never directly by browsers.
REVOKE EXECUTE ON FUNCTION public.increment_request_metrics(boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.track_and_count_visitor(text) FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.increment_request_metrics(boolean) SET search_path = pg_catalog, public;
ALTER FUNCTION public.track_and_count_visitor(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_cms_updated_at() SET search_path = pg_catalog, public;
