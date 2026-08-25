-- Visitors (idempotent, can never fail again)
CREATE TABLE IF NOT EXISTS public.unique_daily_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visit_date, ip_hash)
);
ALTER TABLE public.unique_daily_visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view daily visitor counts" ON public.unique_daily_visitors;
CREATE POLICY "Public can view daily visitor counts" ON public.unique_daily_visitors FOR SELECT USING (true);
DROP POLICY IF EXISTS "System can insert visitors" ON public.unique_daily_visitors;
CREATE POLICY "System can insert visitors" ON public.unique_daily_visitors FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.track_and_count_visitor(p_ip_hash TEXT)
RETURNS INTEGER AS $$
DECLARE today_count INTEGER;
BEGIN
  INSERT INTO public.unique_daily_visitors (visit_date, ip_hash)
  VALUES (CURRENT_DATE, p_ip_hash)
  ON CONFLICT (visit_date, ip_hash) DO NOTHING;
  SELECT COUNT(*) INTO today_count FROM public.unique_daily_visitors WHERE visit_date = CURRENT_DATE;
  RETURN today_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Live stats + pricing badge tables
CREATE TABLE IF NOT EXISTS public.request_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_requests BIGINT DEFAULT 0, blocked_requests BIGINT DEFAULT 0,
  active_users INTEGER DEFAULT 0, last_updated TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.request_metrics (total_requests, blocked_requests, active_users)
SELECT 0,0,0 WHERE NOT EXISTS (SELECT 1 FROM public.request_metrics);
ALTER TABLE public.request_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view request metrics" ON public.request_metrics;
CREATE POLICY "Public can view request metrics" ON public.request_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can update metrics" ON public.request_metrics;
CREATE POLICY "Service role can update metrics" ON public.request_metrics FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.subscription_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL, user_id UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subscription_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view subscription stats" ON public.subscription_stats;
CREATE POLICY "Public can view subscription stats" ON public.subscription_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can record subscription" ON public.subscription_stats;
CREATE POLICY "Anyone can record subscription" ON public.subscription_stats FOR INSERT WITH CHECK (true);

-- Projects table for the dashboard
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  secret_key TEXT NOT NULL,
  allowed_origins TEXT[] DEFAULT '{}',
  sensitivity TEXT DEFAULT 'balanced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners manage projects" ON public.projects;
CREATE POLICY "owners manage projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
