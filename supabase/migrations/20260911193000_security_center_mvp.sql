CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS security_events_user_created_idx ON public.security_events(user_id, created_at DESC);
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.project_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  profile TEXT NOT NULL DEFAULT 'balanced',
  threshold INTEGER NOT NULL DEFAULT 70,
  action TEXT NOT NULL DEFAULT 'block',
  allowed_countries JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_countries JSONB NOT NULL DEFAULT '[]'::jsonb,
  challenge_type TEXT NOT NULL DEFAULT 'behavioral',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, version)
);
CREATE INDEX IF NOT EXISTS project_policies_project_idx ON public.project_policies(project_id, version DESC);
ALTER TABLE public.project_policies ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint_url TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '["verification.blocked"]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  user_id UUID PRIMARY KEY,
  completed JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.security_events, public.project_policies, public.webhook_subscriptions, public.onboarding_progress FROM anon, authenticated;
