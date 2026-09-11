CREATE TABLE IF NOT EXISTS public.login_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  country TEXT,
  is_new_device BOOLEAN NOT NULL DEFAULT true,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS login_alerts_user_created_idx ON public.login_alerts(user_id, created_at DESC);
ALTER TABLE public.login_alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.key_rotation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  interval_days INTEGER NOT NULL CHECK (interval_days IN (7, 30, 60, 90)),
  grace_hours INTEGER NOT NULL DEFAULT 24 CHECK (grace_hours BETWEEN 1 AND 168),
  enabled BOOLEAN NOT NULL DEFAULT true,
  next_rotation_at TIMESTAMPTZ NOT NULL,
  last_rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id)
);
ALTER TABLE public.key_rotation_schedules ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.mfa_enrollments (
  user_id UUID PRIMARY KEY,
  method TEXT NOT NULL CHECK (method IN ('totp', 'passkey', 'security_key')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'enabled', 'disabled')),
  enrolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.mfa_enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.login_alerts, public.key_rotation_schedules, public.mfa_enrollments FROM anon, authenticated;
