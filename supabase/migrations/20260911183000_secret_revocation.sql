ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS secret_key_revoked_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS previous_secret_key_revoked_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS previous_secret_key_expires_at TIMESTAMPTZ;
