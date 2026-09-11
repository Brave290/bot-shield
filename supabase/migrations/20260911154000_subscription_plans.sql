-- Subscription plans and administrator-managed user plan assignments.
CREATE TABLE IF NOT EXISTS public.plan_pricing (
  id TEXT PRIMARY KEY,
  price TEXT NOT NULL,
  tag TEXT NOT NULL,
  monthly_requests BIGINT NOT NULL DEFAULT 1000,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.plan_pricing ADD COLUMN IF NOT EXISTS monthly_requests BIGINT NOT NULL DEFAULT 1000;
ALTER TABLE public.plan_pricing ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.plan_pricing ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

INSERT INTO public.plan_pricing (id, price, tag, monthly_requests, features)
VALUES
  ('Hobby', '0', 'Side projects', 1000, '["Core behavioral detection", "Community support", "Full source access"]'::jsonb),
  ('Pro', '29', 'Real products', 100000, '["Adaptive AI scoring", "Live analytics dashboard", "Priority email support", "99.9% uptime SLA"]'::jsonb),
  ('Enterprise', 'Custom', 'Platforms', -1, '["Unlimited requests", "Dedicated infrastructure", "On-premise deployment", "24/7 support with SLA"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view plan pricing" ON public.plan_pricing;
CREATE POLICY "Public can view plan pricing" ON public.plan_pricing FOR SELECT USING (true);

ALTER TABLE public.subscription_stats
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Keep one current plan assignment per account so admin changes are deterministic.
DELETE FROM public.subscription_stats a
USING public.subscription_stats b
WHERE a.user_id IS NOT NULL
  AND a.user_id = b.user_id
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS subscription_stats_user_id_key
  ON public.subscription_stats(user_id)
  WHERE user_id IS NOT NULL;

DROP POLICY IF EXISTS "Public can view subscription stats" ON public.subscription_stats;
CREATE POLICY "Public can view subscription stats" ON public.subscription_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can record subscription" ON public.subscription_stats;
CREATE POLICY "Anyone can record subscription" ON public.subscription_stats FOR INSERT WITH CHECK (true);
