# Changelog

## [4.0.0] - 2026-09-13

### Security Fixes
- **CRITICAL**: Hardened RLS policies — removed public insert on `subscription_stats`, `rate_limit_events`, `request_metrics`
- **CRITICAL**: Added service-role-only policies for `admins`, `billing_events`, `project_members`, `team_invitations`, `platform_settings`, `job_applications`
- **HIGH**: Added rate limiting to contact form and career application endpoints
- **HIGH**: Added input length validation on contact endpoint
- **HIGH**: Billing webhook now validates tier names and logs subscription state changes
- **HIGH**: Account deletion is now transactional with error tracking and audit trail

### Database
- New migration `20260913000000_v4_security_hardening.sql` with RLS fixes and performance indexes
- Added indexes for `projects.user_id`, `team_invitations.invited_by`, `verification_logs.project_id`, `verification_logs.created_at`, `rate_limit_events.scope_key`, `subscription_stats.user_id`, `audit_logs.actor_email`, `audit_logs.created_at`, `billing_events.event_id`

### Features
- **Rules Simulator** — Rebuilt with scoring explanation, signal breakdown, and configurable inputs
- **Admin Console v4** — Upgraded control plane version badge
- **Dashboard v4** — Enhanced project cards, setup health checklist, usage stats

### Improvements
- Added `Retry-After` headers on rate-limited contact and career endpoints
- Added audit log entries for subscription state changes via Paystack webhook
- Contact form now validates input lengths (name: 200, email: 254, message: 5000 chars)
- Account deletion now cleans up all dependent rows with error tracking before deleting Auth user
- Updated AGENTS.md with comprehensive agent instructions
- Updated README with v4 feature list

## [1.0.0-security-patch] - 2026-09-09

### Security Fixes
- **CRITICAL**: Implemented real behavioral telemetry in client widget (was all-zero stub)
- **CRITICAL**: Fixed JWT secret encoding mismatch in sign/verify operations
- **HIGH**: Added Zod schema validation to all API endpoints
- **HIGH**: Enforced fail-closed rate limiting with proper error handling
- **MEDIUM**: Improved secret storage with HMAC-SHA256 key derivation
- **MEDIUM**: Added dynamic API origin detection for custom domain support
- **MEDIUM**: Created `.env.example` for self-hosting setup

### Features
- Real-time mouse movement tracking (distance, time, curves)
- Real-time keyboard tracking (typing speed, backspace frequency)
- Multi-signal browser fingerprinting
- Dynamic widget API origin auto-detection
- Comprehensive input validation with Zod

### Improvements
- Enhanced error handling with explicit HTTP status codes (400, 401, 403, 429, 500, 503)
- Improved bot classification with edge case handling
- Better documentation in scoring engine and bot type detection
- Consistent key derivation for JWT operations

### Breaking Changes
- None - all changes are backward compatible

### Migration Required
- Optional: Run `/api/migrate-secrets` to hash all plaintext secrets
- Update `.env.local` using new `.env.example` as template

### Testing
- All core functionality validated with smoke tests
- Recommended: Add unit tests for scoring engine
- Recommended: Add integration tests for API workflows
