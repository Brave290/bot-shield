-- 1. Developers using your API
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. The specific projects/websites they create
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL, 
  secret_key TEXT UNIQUE NOT NULL, 
  sensitivity TEXT DEFAULT 'balanced' CHECK (sensitivity IN ('strict', 'balanced', 'loose')),
  allowed_origins TEXT[] DEFAULT '{}', 
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. The actual bot detection logs
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  browser_fingerprint TEXT,
  mouse_score INT,
  typing_score INT,
  total_score INT,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Layer 12 (Security): Row Level Security Policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);
