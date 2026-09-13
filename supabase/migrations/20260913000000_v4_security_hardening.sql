-- BotShield v4 Security Hardening Migration
-- Fixes critical RLS issues identified in platform audit

-- 1. Fix subscription_stats: Remove public insert policy, add service-role-only policy
DROP POLICY IF EXISTS "Anyone can record subscription" ON public.subscription_stats;
DROP POLICY IF EXISTS "system all events" ON public.subscription_stats;
CREATE POLICY "service_role_manage_subscriptions" ON public.subscription_stats
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Fix rate_limit_events: Remove public ALL policy
DROP POLICY IF EXISTS "system all events" ON public.rate_limit_events;
CREATE POLICY "service_role_manage_rate_limit_events" ON public.rate_limit_events
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Fix request_metrics: Remove public ALL policy
DROP POLICY IF EXISTS "Service role can update metrics" ON public.request_metrics;
CREATE POLICY "service_role_manage_metrics" ON public.request_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Add explicit deny-by-default policies for sensitive tables
-- admins
DROP POLICY IF EXISTS "admins_service_role_only" ON public.admins;
CREATE POLICY "admins_service_role_only" ON public.admins
  FOR ALL USING (auth.role() = 'service_role');

-- billing_events
DROP POLICY IF EXISTS "billing_events_service_role_only" ON public.billing_events;
CREATE POLICY "billing_events_service_role_only" ON public.billing_events
  FOR ALL USING (auth.role() = 'service_role');

-- project_members
DROP POLICY IF EXISTS "project_members_service_role_only" ON public.project_members;
CREATE POLICY "project_members_service_role_only" ON public.project_members
  FOR ALL USING (auth.role() = 'service_role');

-- team_invitations
DROP POLICY IF EXISTS "team_invitations_service_role_only" ON public.team_invitations;
CREATE POLICY "team_invitations_service_role_only" ON public.team_invitations
  FOR ALL USING (auth.role() = 'service_role');

-- platform_settings
DROP POLICY IF EXISTS "platform_settings_service_role_only" ON public.platform_settings;
CREATE POLICY "platform_settings_service_role_only" ON public.platform_settings
  FOR ALL USING (auth.role() = 'service_role');

-- job_applications
DROP POLICY IF EXISTS "job_applications_service_role_only" ON public.job_applications;
CREATE POLICY "job_applications_service_role_only" ON public.job_applications
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Add performance indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_by ON public.team_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_verification_logs_project_id ON public.verification_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON public.verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_scope_key ON public.rate_limit_events(scope_key);
CREATE INDEX IF NOT EXISTS idx_subscription_stats_user_id ON public.subscription_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON public.audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_event_id ON public.billing_events(event_id);
