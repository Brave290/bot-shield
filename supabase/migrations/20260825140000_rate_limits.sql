-- Rate limit configurations (admin editable)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  window_seconds INTEGER NOT NULL DEFAULT 3600,
  max_attempts INTEGER NOT NULL DEFAULT 10,
  scope TEXT NOT NULL DEFAULT 'ip',
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert standard rate limits
INSERT INTO public.rate_limits (id, endpoint, window_seconds, max_attempts, scope, description) VALUES
('signup_ip', '/api/auth/signup', 3600, 5, 'ip', 'Maximum signups per IP per hour'),
('login_ip', '/api/auth/login', 3600, 10, 'ip', 'Maximum login attempts per IP per hour'),
('login_email', '/api/auth/login', 3600, 5, 'email', 'Maximum login attempts per email per hour'),
('password_reset', '/api/auth/reset', 3600, 3, 'email', 'Maximum password resets per email per hour'),
('contact_form', '/api/contact', 3600, 5, 'ip', 'Maximum contact form submissions per IP per hour'),
('api_key', '/api/verify', 60, 100, 'api_key', 'Maximum API calls per key per minute')
ON CONFLICT (id) DO NOTHING;

-- Rate limit event tracking
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_id TEXT NOT NULL REFERENCES public.rate_limits(id) ON DELETE CASCADE,
  scope_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_events_lookup ON public.rate_limit_events(limit_id, scope_key, created_at DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read limits" ON public.rate_limits;
CREATE POLICY "public read limits" ON public.rate_limits FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin write limits" ON public.rate_limits;
CREATE POLICY "admin write limits" ON public.rate_limits FOR ALL USING (true);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system insert events" ON public.rate_limit_events;
CREATE POLICY "system insert events" ON public.rate_limit_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "system select events" ON public.rate_limit_events;
CREATE POLICY "system select events" ON public.rate_limit_events FOR SELECT USING (true) WITH CHECK (true);
