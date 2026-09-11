-- Batch 1 product foundations: entitlements, billing state, teams, invitations, and key rotation.
ALTER TABLE public.plan_pricing ADD COLUMN IF NOT EXISTS max_projects INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.plan_pricing ADD COLUMN IF NOT EXISTS rate_limit_per_min INTEGER NOT NULL DEFAULT 100;
ALTER TABLE public.plan_pricing ADD COLUMN IF NOT EXISTS retention_days INTEGER NOT NULL DEFAULT 7;

UPDATE public.plan_pricing SET max_projects = 1, rate_limit_per_min = 100, retention_days = 7 WHERE id = 'Hobby';
UPDATE public.plan_pricing SET max_projects = 10, rate_limit_per_min = 1000, retention_days = 90 WHERE id = 'Pro';
UPDATE public.plan_pricing SET max_projects = 100, rate_limit_per_min = 10000, retention_days = 3650 WHERE id = 'Enterprise';

ALTER TABLE public.subscription_stats ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.subscription_stats ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.subscription_stats ADD COLUMN IF NOT EXISTS customer_code TEXT;
ALTER TABLE public.subscription_stats ADD COLUMN IF NOT EXISTS subscription_code TEXT;
ALTER TABLE public.subscription_stats ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS previous_secret_key TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS secret_key_rotated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'developer', 'analyst', 'viewer')),
  token_hash TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS team_invitations_project_idx ON public.team_invitations(project_id);

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'admin', 'developer', 'analyst', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS project_members_user_idx ON public.project_members(user_id);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id)
);
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
