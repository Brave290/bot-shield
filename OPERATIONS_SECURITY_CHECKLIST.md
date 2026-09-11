# BotShield Operations Security Checklist

Use this checklist before production launch, after any security change, and whenever an administrator or deployment environment changes. Never place secret values in GitHub issues, screenshots, logs, browser code, or this file.

## Environment variables

Verify each variable exists in the correct Vercel environment and is different between Development, Preview, and Production unless explicitly marked public.

| Variable | Required environments | Secret? | Manual verification |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Development, Preview, Production | No | Matches the intended Supabase project URL; Preview must not point at production unless explicitly approved |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Development, Preview, Production | No | Matches the same Supabase project as the URL; safe for browser exposure but still environment-specific |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, all deployed environments | Yes | Never appears in client bundles, logs, Git, screenshots, or `NEXT_PUBLIC_*`; Preview uses a non-production project/key |
| `ADMIN_EMAILS` | Server only, all deployed environments | No | Contains only intended admin addresses, comma-separated; every address has a matching Supabase Auth user and database admin record after bootstrap |
| `ADMIN_API_KEY` | Server only if used by an endpoint | Yes | Long random value; unique per environment; rotate if ever exposed; verify no route accepts it unintentionally |
| `CRON_SECRET` | Server only | Yes | Long random value; Vercel Cron sends it; direct calls without it return `401/403` |
| `BOTSHIELD_SECRET` | Server only | Yes | Long random value unique to the environment; never reused for Paystack, Supabase, or admin access |
| `NEXT_PUBLIC_APP_URL` | Development, Preview, Production | No | Exact canonical URL with no trailing slash; auth redirects and webhook URLs use the same intended domain |
| `PAYSTACK_SECRET_KEY` | Server only | Yes | Test key in Preview/Development, live key only in Production; never sent to the browser |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Development, Preview, Production | No | Public key matches the Paystack account/environment used by the server secret |
| `PAYSTACK_WEBHOOK_SECRET` | Server only if configured | Yes | Matches the provider webhook configuration; webhook rejects missing/invalid signatures |
| `RESEND_API_KEY` or platform-stored Resend key | Server only | Yes | Stored only in Vercel/server settings or protected platform settings; test-email action is admin-only |
| `BASE_URL` | Tests/Preview | No | Points smoke tests to the intended isolated deployment, never a destructive production target |
| `SMOKE_API_KEY` | CI/Preview tests | Yes | Dedicated non-production BotShield project key |
| `SMOKE_SECRET_KEY` | CI/Preview tests | Yes | Matching dedicated non-production secret; never production |
| `RESEND_FROM_EMAIL` / notification settings | Server only | No/secret depending on provider | Domain is verified with the mail provider; notification recipient is an approved mailbox |

### Environment verification procedure

1. Compare Vercel Production, Preview, and Development variable names against `.env.example` and this table.
2. Confirm Preview uses an isolated Supabase project or an explicitly approved isolated schema.
3. Redeploy after changing any variable; do not assume a running deployment picked up new values.
4. Inspect the built browser bundle and network requests for absence of service-role, Paystack secret, cron, admin, and BotShield server secrets.
5. Rotate a disposable Preview secret and confirm the old value stops working before rotating Production values.
6. Verify `NEXT_PUBLIC_APP_URL`, Supabase Auth redirect URLs, Vercel domains, and Paystack webhook URL agree exactly.

## Supabase manual verification

### Auth

- [ ] Email confirmation is enabled in Production.
- [ ] Leaked-password protection is enabled.
- [ ] Minimum password length is at least 12 characters or an approved equivalent.
- [ ] Password requirements include upper/lowercase, digits, and symbols where appropriate.
- [ ] Secure password change and recent reauthentication are enabled.
- [ ] MFA is enabled for every admin and owner account.
- [ ] Anonymous sign-in is disabled unless the product explicitly needs it.
- [ ] Auth rate limits and email/SMS provider limits are configured.
- [ ] Redirect URLs contain only approved exact domains and paths.
- [ ] Production SMTP uses a verified sender domain and working delivery test.

### Database and RLS

- [ ] Run Supabase security advisors after every migration.
- [ ] No sensitive table has `public` or `anon` write policies.
- [ ] `subscription_stats`, `billing_events`, `rate_limit_events`, `request_metrics`, `audit_logs`, `verification_logs`, `admins`, `platform_settings`, `project_members`, and `team_invitations` are server/member/admin controlled as intended.
- [ ] Security-definer functions have explicit `search_path` and least-privilege `EXECUTE` grants.
- [ ] Anonymous and authenticated RPC calls to internal functions fail.
- [ ] RLS policies use explicit roles and `(select auth.uid())` where applicable.
- [ ] Sensitive data is not readable through PostgREST by anonymous callers.
- [ ] Foreign keys have indexes where workload requires them.
- [ ] Migration history in Supabase matches the canonical repository migration history.
- [ ] A fresh disposable database can apply all migrations without manual edits.
- [ ] A restore from backup has been tested and documented.

### Storage

- [ ] Careers bucket remains private.
- [ ] Storage object policies permit only intended upload/read/delete paths.
- [ ] Signed CV URLs expire quickly and are never stored as permanent public URLs.
- [ ] Upload size, MIME, signature, malware scanning, and retention controls are verified.
- [ ] Deleted applications remove associated storage objects.

## Application and API verification

- [ ] Public challenge and verify endpoints enforce payload schemas, origin rules, quotas, and atomic rate limits.
- [ ] Login, signup, contact, careers, demo keys, team invites, billing initialization, and account deletion have route-specific rate limits.
- [ ] All admin mutations validate fields, enforce role/capability, check write errors, and create audit events.
- [ ] Project creation validates names, origins, sensitivity, and quotas atomically.
- [ ] Account deletion removes dependent project/member/invitation rows transactionally.
- [ ] Billing webhook validates signature, event type, user identity, plan, amount, currency, reference, and replay/idempotency.
- [ ] API responses never return secret keys, service-role values, password data, or full payment payloads.
- [ ] Error responses do not include provider credentials, SQL errors, stack traces, or raw request bodies.
- [ ] CORS is exact-origin for authenticated/private routes and wildcard only for intentionally public endpoints.
- [ ] Security headers include CSP, HSTS in Production, frame protection, MIME sniffing protection, and a strict referrer policy.

## Admin and operational verification

- [ ] Admin dashboard user list paginates and does not silently stop at 1,000 users.
- [ ] User drawer shows only approved account metadata and never secrets.
- [ ] Destructive actions require confirmation and are audit logged.
- [ ] Owner transfer requires recent reauthentication or MFA.
- [ ] Admin removal cannot remove the last owner without an approved recovery path.
- [ ] Cron endpoint rejects missing or incorrect `CRON_SECRET`.
- [ ] Cron jobs are idempotent and have failure alerts.
- [ ] Audit logs are append-only to application roles and retained according to policy.
- [ ] Alerts exist for repeated auth failures, rate-limit spikes, webhook failures, admin changes, key rotations, and database errors.
- [ ] Incident response contacts and escalation owners are documented.

## Required CI checks

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:integration`
- [ ] Smoke tests with isolated non-production keys
- [ ] `npm audit` or an approved dependency scanner
- [ ] Secret scanning (Gitleaks/GitHub secret scanning)
- [ ] CodeQL or equivalent static analysis
- [ ] Migration test against a fresh database
- [ ] RLS negative tests for anonymous and cross-tenant access
- [ ] License and dependency review for open-source releases

## Incident actions

If a service-role key, project secret, Paystack secret, admin credential, or webhook signing secret is exposed: disable or rotate it immediately, review audit/provider logs, invalidate active sessions where appropriate, check for unauthorized rows or policy changes, preserve evidence, notify affected users when required, and document the incident privately. Do not commit the exposed value or its replacement to Git.
