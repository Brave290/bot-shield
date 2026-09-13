-- BotShield v4.1.0: New Features + New Products
-- 20 new features + 10 new products

-- ============================================================
-- SECTION 1: NEW FEATURES (20)
-- ============================================================

-- 1. Webhook delivery & replay
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT md5(random()::text),
  events TEXT[] DEFAULT ARRAY['verification.blocked', 'verification.human', 'quota.warning'],
  active BOOLEAN DEFAULT true,
  last_delivery_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alert policies
CREATE TABLE IF NOT EXISTS public.alert_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('bot_rate', 'error_rate', 'traffic_volume', 'quota_usage', 'verification_blocked')),
  threshold NUMERIC NOT NULL,
  window_minutes INTEGER NOT NULL DEFAULT 60,
  channels TEXT[] DEFAULT ARRAY['email'],
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.alert_policies(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  metric_value NUMERIC NOT NULL,
  message TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ
);

-- 3. Decision explanations (enhanced audit)
CREATE TABLE IF NOT EXISTS public.decision_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('human', 'blocked')),
  signals JSONB NOT NULL DEFAULT '{}',
  factors JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. IP/ASN/country controls
CREATE TABLE IF NOT EXISTS public.threat_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  list_type TEXT NOT NULL CHECK (list_type IN ('ip_allowlist', 'ip_denylist', 'country_allowlist', 'country_denylist', 'asn_allowlist', 'asn_denylist')),
  entries TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bot fingerprint history
CREATE TABLE IF NOT EXISTS public.fingerprint_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_requests INTEGER DEFAULT 1,
  blocked_count INTEGER DEFAULT 0,
  avg_score NUMERIC DEFAULT 0,
  countries TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fingerprint_hash ON public.fingerprint_history(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_fingerprint_project ON public.fingerprint_history(project_id);

-- 10. Synthetic traffic testing
CREATE TABLE IF NOT EXISTS public.test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  run_type TEXT NOT NULL CHECK (run_type IN ('human_simulation', 'bot_simulation', 'mixed')),
  request_count INTEGER NOT NULL DEFAULT 10,
  results JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Incident investigation workspace
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  related_requests UUID[] DEFAULT '{}',
  notes TEXT[] DEFAULT '{}',
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 12. Audit exports
CREATE TABLE IF NOT EXISTS public.export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('audit_logs', 'verification_logs', 'billing_events', 'users', 'all')),
  format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv', 'json')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  row_count INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SLA & status visibility
CREATE TABLE IF NOT EXISTS public.status_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  affected_components TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  updates JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  affected_components TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Model feedback loop
CREATE TABLE IF NOT EXISTS public.feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  verification_log_id UUID,
  original_score INTEGER NOT NULL,
  original_status TEXT NOT NULL,
  corrected_status TEXT NOT NULL CHECK (corrected_status IN ('human', 'blocked')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Privacy & retention controls
CREATE TABLE IF NOT EXISTS public.retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('verification_logs', 'rate_limit_events', 'analytics', 'all')),
  retention_days INTEGER NOT NULL DEFAULT 90,
  auto_delete BOOLEAN DEFAULT false,
  last_cleanup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Quota ledger
CREATE TABLE IF NOT EXISTS public.quota_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  allocated INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  overage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quota_ledger_user_period ON public.quota_ledger(user_id, period_start);

-- 18. Multi-language SDK tracking
CREATE TABLE IF NOT EXISTS public.sdk_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sdk_language TEXT NOT NULL,
  sdk_version TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Team permissions v2
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'developer', 'analyst', 'viewer')),
  resource TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- Insert default permissions
INSERT INTO public.role_permissions (role, resource, action, granted) VALUES
  ('admin', 'projects', 'create', true),
  ('admin', 'projects', 'read', true),
  ('admin', 'projects', 'update', true),
  ('admin', 'projects', 'delete', true),
  ('admin', 'analytics', 'read', true),
  ('admin', 'team', 'manage', true),
  ('developer', 'projects', 'read', true),
  ('developer', 'projects', 'update', true),
  ('developer', 'analytics', 'read', true),
  ('developer', 'webhooks', 'manage', true),
  ('analyst', 'analytics', 'read', true),
  ('analyst', 'incidents', 'read', true),
  ('analyst', 'feedback', 'create', true),
  ('viewer', 'projects', 'read', true),
  ('viewer', 'analytics', 'read', true)
ON CONFLICT DO NOTHING;

-- 20. Observability integrations
CREATE TABLE IF NOT EXISTS public.observability_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('opentelemetry', 'prometheus', 'sentry', 'datadog', 'custom')),
  endpoint_url TEXT,
  api_key_encrypted TEXT,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- SECTION 2: NEW PRODUCTS (10)
-- ============================================================

-- Product 1: BotShield Scanner
CREATE TABLE IF NOT EXISTS public.scanner_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  scan_type TEXT NOT NULL DEFAULT 'quick' CHECK (scan_type IN ('quick', 'full', 'custom')),
  schedule_cron TEXT,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scanner_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID NOT NULL REFERENCES public.scanner_targets(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  findings JSONB DEFAULT '[]',
  score INTEGER,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 2: BotShield WAF
CREATE TABLE IF NOT EXISTS public.waf_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('block', 'allow', 'challenge', 'log')),
  conditions JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 100,
  enabled BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.waf_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.waf_rules(id) ON DELETE SET NULL,
  action_taken TEXT NOT NULL,
  request_path TEXT,
  ip_hash TEXT,
  country TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 3: BotShield Proxy
CREATE TABLE IF NOT EXISTS public.proxy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  origin_url TEXT NOT NULL,
  proxy_path TEXT NOT NULL UNIQUE,
  bot_detection_enabled BOOLEAN DEFAULT true,
  rate_limit_per_min INTEGER DEFAULT 100,
  cache_ttl_seconds INTEGER DEFAULT 0,
  headers JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proxy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.proxy_configs(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  bot_score INTEGER,
  bot_status TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 4: BotShield API Shield
CREATE TABLE IF NOT EXISTS public.api_shield_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  api_name TEXT NOT NULL,
  base_path TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('api_key', 'jwt', 'oauth2', 'mtls')),
  rate_limit_per_min INTEGER DEFAULT 60,
  bot_protection BOOLEAN DEFAULT true,
  schema_validation BOOLEAN DEFAULT false,
  request_schema JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.api_shield_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.api_shield_configs(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  bot_score INTEGER,
  auth_result TEXT,
  validation_errors JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 5: BotShield Identity
CREATE TABLE IF NOT EXISTS public.identity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  bot_score INTEGER,
  bot_status TEXT,
  ip_hash TEXT,
  device_fingerprint TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_identity_session_token ON public.identity_sessions(session_token);

CREATE TABLE IF NOT EXISTS public.identity_auth_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('password', 'magic_link', 'webauthn', 'totp')),
  enabled BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 6: BotShield Analytics (standalone)
CREATE TABLE IF NOT EXISTS public.analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  widgets JSONB NOT NULL DEFAULT '[]',
  layout JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 7: BotShield Compliance
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('soc2', 'gdpr', 'hipaa', 'iso27001', 'custom')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  file_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  findings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.compliance_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id TEXT NOT NULL,
  framework TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'implemented', 'verified', 'failed')),
  evidence JSONB DEFAULT '[]',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 8: BotShield Test Lab
CREATE TABLE IF NOT EXISTS public.test_lab_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('human', 'bot', 'sophisticated_bot', 'mixed')),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_lab_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.test_lab_profiles(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 100,
  concurrency INTEGER NOT NULL DEFAULT 1,
  results JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 9: BotShield Edge
CREATE TABLE IF NOT EXISTS public.edge_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('cloudflare_workers', 'deno_deploy', 'vercel_edge', 'netlify_edge')),
  deployment_url TEXT,
  config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'active', 'failed', 'removed')),
  last_deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.edge_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL REFERENCES public.edge_deployments(id) ON DELETE CASCADE,
  request_path TEXT,
  bot_score INTEGER,
  action TEXT,
  edge_region TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product 10: BotShield Marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('rule', 'fingerprint', 'threat_feed', 'integration', 'template')),
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  downloads INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- RLS POLICIES FOR ALL NEW TABLES
-- ============================================================

-- Webhook tables
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_endpoints_service_role" ON public.webhook_endpoints FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "webhook_deliveries_service_role" ON public.webhook_deliveries FOR ALL USING (auth.role() = 'service_role');

-- Alert tables
ALTER TABLE public.alert_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert_policies_service_role" ON public.alert_policies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "alert_history_service_role" ON public.alert_history FOR ALL USING (auth.role() = 'service_role');

-- Decision explanations
ALTER TABLE public.decision_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decision_explanations_service_role" ON public.decision_explanations FOR ALL USING (auth.role() = 'service_role');

-- Threat lists
ALTER TABLE public.threat_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threat_lists_service_role" ON public.threat_lists FOR ALL USING (auth.role() = 'service_role');

-- Fingerprint history
ALTER TABLE public.fingerprint_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fingerprint_history_service_role" ON public.fingerprint_history FOR ALL USING (auth.role() = 'service_role');

-- Test runs
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_runs_service_role" ON public.test_runs FOR ALL USING (auth.role() = 'service_role');

-- Incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents_service_role" ON public.incidents FOR ALL USING (auth.role() = 'service_role');

-- Export jobs
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "export_jobs_service_role" ON public.export_jobs FOR ALL USING (auth.role() = 'service_role');

-- Status pages
ALTER TABLE public.status_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "status_incidents_service_role" ON public.status_incidents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "maintenance_windows_service_role" ON public.maintenance_windows FOR ALL USING (auth.role() = 'service_role');

-- Feedback
ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_entries_service_role" ON public.feedback_entries FOR ALL USING (auth.role() = 'service_role');

-- Retention
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "retention_policies_service_role" ON public.retention_policies FOR ALL USING (auth.role() = 'service_role');

-- Quota ledger
ALTER TABLE public.quota_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quota_ledger_service_role" ON public.quota_ledger FOR ALL USING (auth.role() = 'service_role');

-- SDK downloads
ALTER TABLE public.sdk_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sdk_downloads_service_role" ON public.sdk_downloads FOR ALL USING (auth.role() = 'service_role');

-- Role permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_service_role" ON public.role_permissions FOR ALL USING (auth.role() = 'service_role');

-- Observability
ALTER TABLE public.observability_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "observability_configs_service_role" ON public.observability_configs FOR ALL USING (auth.role() = 'service_role');

-- Product tables RLS
ALTER TABLE public.scanner_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waf_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waf_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_shield_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_shield_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_auth_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_lab_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_lab_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

-- All product tables service-role only
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'scanner_targets', 'scanner_results', 'waf_rules', 'waf_events',
    'proxy_configs', 'proxy_logs', 'api_shield_configs', 'api_shield_logs',
    'identity_sessions', 'identity_auth_methods', 'analytics_dashboards',
    'analytics_saved_filters', 'compliance_reports', 'compliance_controls',
    'test_lab_profiles', 'test_lab_runs', 'edge_deployments', 'edge_logs',
    'marketplace_items', 'marketplace_purchases'
  ]) LOOP
    EXECUTE format('CREATE POLICY "%s_service_role" ON public.%s FOR ALL USING (auth.role() = ''service_role'')', tbl, tbl);
  END LOOP;
END $$;
