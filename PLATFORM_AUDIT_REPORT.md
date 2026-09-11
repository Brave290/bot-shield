# BotShield Platform Audit Report

**Repository:** `Brave290/bot-shield`  
**Audit date:** 2026-09-11  
**Audited branch:** `main`  
**Audit commit before report:** `c34c246e2e7dccc8e155fe32a0f687260e137d42`  
**Supabase project inspected:** `BOT-SHIELD API` (`hqsxbchyuufiasdmaora`, `eu-west-1`)  
**Scope:** application code, API routes, authentication and authorization, secrets handling, rate limiting, database migrations, live Supabase schema/RLS/functions/storage, dependency health, tests, and open-source readiness.

> This is a code-and-configuration audit, not a formal penetration test. No destructive database actions were performed. Live checks were read-only, and no secret values were copied into this report.

## Executive summary

BotShield has a coherent Next.js/Supabase architecture and already includes useful protections such as server-side use of the Supabase service-role client, signed short-lived verification JWTs, project-level origin/IP controls, secret rotation fields, an audit log, a private careers bucket, and integration contract tests. The live database is healthy and contains the expected product domains: projects, verification logs, rate limiting, subscriptions, teams, CMS, billing, admin, and operational history.

The current posture is **not yet ready to be presented as a hardened security product or production-grade open-source reference implementation**. The most urgent issue is authorization at the database boundary. Several tables have RLS enabled but no policy, while other policies are granted to the broad `public` role and allow unrestricted inserts, reads, or all operations. The live advisors also report security-definer functions executable by anonymous users, mutable function search paths, and disabled leaked-password protection. At the application layer, admin mutations are mostly trusted after a basic admin check, the rate limiter is a count-then-insert design vulnerable to races, and project secrets still support plaintext/legacy storage paths.

The report recommends first locking down the data plane and authentication boundaries, then making migrations reproducible, adding automated security tests, and only afterward expanding the feature surface.

## Overall assessment

| Area | Assessment | Priority |
|---|---|---:|
| Application structure | Good foundation, but several routes are overly permissive and have inconsistent validation | High |
| Authentication | Supabase token validation is used, but auth policy and password hardening need work | High |
| Authorization | Admin and owner paths are mostly server-checked; database policies are inconsistent and in places unsafe | Critical |
| Secrets and cryptography | Short-lived JWTs and rotation support exist; plaintext/legacy secret compatibility remains | High |
| Rate limiting | Present across important endpoints, but not atomic and not uniformly applied | High |
| Database | RLS is enabled broadly, but policies are missing, redundant, or too permissive | Critical |
| Migrations | Repository and live migration history do not line up cleanly | High |
| Payments | Paystack signature verification and idempotency are present; event/user validation needs strengthening | High |
| Testing | TypeScript and integration contract tests pass; smoke tests are skipped without keys; security regression coverage is limited | High |
| Dependency health | Production dependency audit reports one critical Next.js issue and one high Sharp issue | Critical |
| Documentation | Several operational documents exist, but they do not yet describe the live schema, policy model, threat model, or recovery process completely | Medium |
| Open-source readiness | Good starting point; needs contributor workflow, threat model, security disclosure process, fixtures, and reproducible local setup | Medium |

## System inventory and architecture

The platform is a Next.js 16 application using React 19, Tailwind, Supabase Auth/Postgres/Storage, and Paystack. Server routes use a service-role Supabase client in `src/lib/supabase/server.ts`. Public verification is split into challenge and verify endpoints. Authenticated product operations include project creation/deletion, analytics, team invitations, subscriptions, and account deletion. Admin operations are centralized in `app/api/admin/data/route.ts` and protected by `getAdmin()` in `src/lib/admin.ts`.

The database currently contains 19 public tables, including `users`, `projects`, `verification_logs`, `rate_limits`, `rate_limit_events`, `subscription_stats`, `billing_events`, `project_members`, `team_invitations`, `admins`, `audit_logs`, CMS/blog/contact tables, and operational metrics/history. RLS is enabled on all reported public tables. The only inspected storage bucket is `careers`, and it is private.

## Findings and loopholes

### Critical findings

#### C-01: Sensitive tables have RLS enabled but no policies

**Evidence:** Supabase security advisor `rls_enabled_no_policy` reports six tables with RLS and no policies:

- `public.admins`
- `public.billing_events`
- `public.job_applications`
- `public.platform_settings`
- `public.project_members`
- `public.team_invitations`

**Impact:** Direct PostgREST access by `anon` or `authenticated` is denied today, which is safer than an open table, but the security boundary is implicit and undocumented. Future policy changes, role changes, or accidental service-role exposure could create an immediate data leak. Team and admin data also lack a database-enforced ownership model.

**Required fix:** Add explicit deny-by-default policies or carefully scoped owner/member/admin policies. Prefer dedicated policies for `authenticated` and `service_role` rather than relying on the absence of policies. Add SQL tests that assert each sensitive table has the expected policy set.

#### C-02: Public can insert subscription records

**Evidence:** Live policy `Anyone can record subscription` on `public.subscription_stats` is `INSERT` for the broad `public` role with `WITH CHECK (true)`.

**Impact:** An unauthenticated caller can potentially create arbitrary subscription rows, including choosing a `user_id` and tier. Application routes use this table to determine plan and quota, so this can become a plan escalation, quota bypass, or account-integrity issue if any route reads the manipulated row.

**Required fix:** Drop the policy immediately. Only the verified billing webhook/service role should write subscription state, or use a security-definer function that validates the event and user. Add a unique constraint on the intended business key and test that anonymous inserts fail.

#### C-03: Public can write rate-limit events and metrics

**Evidence:** Live policy `system all events` on `public.rate_limit_events` allows `ALL` with `USING (true)` and `WITH CHECK (true)`. `request_metrics` also has a public `ALL` policy named `Service role can update metrics`.

**Impact:** Anonymous clients can forge or delete rate-limit events, poison operational metrics, and potentially cause denial of service by filling the tables. The application uses the service-role client, but the database is still exposed through Supabase's API surface.

**Required fix:** Revoke all anon/authenticated DML. Keep writes service-role-only, or expose a narrow RPC with strict argument bounds. Add retention and indexes. Verify with anonymous and authenticated negative tests.

#### C-04: Security-definer RPCs are executable by anonymous users

**Evidence:** Supabase advisor reports `increment_request_metrics(boolean)` and `track_and_count_visitor(text)` as `SECURITY DEFINER` functions executable by both `anon` and `authenticated`.

**Impact:** These functions run with elevated privileges. `track_and_count_visitor` accepts caller-controlled text and writes visitor rows; `increment_request_metrics` lets callers increment global metrics. Even where the direct business impact is limited, this violates least privilege and creates an elevated SQL injection/search-path risk if the functions evolve.

**Required fix:** Revoke `EXECUTE` from `anon` and `authenticated`, grant only to the server/service role if the integration supports it, and set an explicit immutable `search_path` such as `pg_catalog, public` (or schema-qualified every object). Add bounds and input normalization. Confirm the exposed RPC endpoints are no longer callable by public roles.

#### C-05: Dependency audit reports a critical Next.js issue and high Sharp issues

**Evidence:** `npm audit --omit=dev --audit-level=moderate` reports Next.js `16.0.0–16.3.2` advisories and Sharp/libheif vulnerabilities. The project is pinned to Next `16.3.2`.

**Impact:** Known vulnerabilities in a public web service increase the attack surface, particularly around image handling and framework request processing.

**Required fix:** Upgrade Next.js to the first patched release supported by the project, refresh the lockfile, rebuild, run integration/smoke tests, and review the Next.js migration notes. Ensure Sharp is updated transitively or directly. Do not use `npm audit fix --force` blindly; review the resulting dependency diff.

### High findings

#### H-01: Plaintext and legacy project-secret support remain in the verification path

**Evidence:** `app/api/challenge/route.ts` signs JWTs with `project.secret_key`. `app/api/verify/route.ts` first checks a derived hash, then falls back to plaintext `secret_key` and `previous_secret_key`. The live `projects` table has unique `secret_key` and `previous_secret_key` text columns.

**Impact:** A database read leak exposes reusable API credentials. The service must retrieve a plaintext secret to sign challenge tokens, so a service-role compromise becomes especially damaging. Legacy fallback extends the lifetime of weak storage.

**Required fix:** Move to a one-way key-verification model where the challenge endpoint signs with a server-held project signing secret or a versioned encrypted secret, and verification looks up a key identifier plus a constant-time hash comparison. Encrypt at rest with a managed key if signing requires recovery. Remove plaintext fallback after a migration window, rotate all existing keys, and never return secret values from admin or project APIs.

#### H-02: Rate limiting is non-atomic and inconsistently scoped

**Evidence:** `src/lib/rate-limit.ts` and `app/api/challenge/route.ts` count existing events and then insert a new event in separate operations. Challenge scopes by raw API key and verify scopes by raw IP. Several public routes do not use the shared limiter.

**Impact:** Concurrent requests can pass the same limit. Raw API keys/IPs are stored in some event paths, increasing sensitivity. A caller can distribute requests across keys/IPs or exploit unprotected contact, career, account, and team endpoints.

**Required fix:** Implement a database-backed atomic limiter using a single RPC/upsert or a Redis-compatible counter. Hash all scopes before storage. Apply limits to login/signup, challenge, verify, demo keys, contact, career uploads, invitations, billing initialization, and account deletion. Return `Retry-After` consistently and add concurrency tests.

#### H-03: Admin mutations lack field-level validation and some lack audit logging

**Evidence:** `app/api/admin/data/route.ts` accepts arbitrary `req.json()` values. `save-rate-limit` writes `max_attempts`, `window_seconds`, and `enabled` without bounds or error handling. `update-project` parses values but does not validate IP syntax, ranges, or project ID. `delete-project`, `delete-message`, `delete-application`, and rate-limit updates have incomplete error handling/audit consistency.

**Impact:** A compromised or misconfigured admin account can corrupt platform configuration, create unusable limits, delete records partially, or inject malformed data. Failed sub-operations can leave inconsistent state while returning success.

**Required fix:** Use shared Zod schemas for every mutation. Enforce owner/admin roles per action, not only a broad admin check. Wrap multi-step destructive operations in transactions or database functions. Check every write result, emit structured audit events, and add idempotency for destructive operations.

#### H-04: Project creation trusts client-controlled sensitivity and origin values

**Evidence:** `app/api/projects/create/route.ts` accepts `body.sensitivity` without an allowlist, accepts arbitrary `origin`, and checks project quotas with a separate count before inserting.

**Impact:** Invalid configuration can be persisted; concurrent requests can exceed plan project limits. Origin matching may also behave unexpectedly if malformed schemes, paths, or wildcard-like values are stored.

**Required fix:** Validate sensitivity against `strict|balanced|loose`; parse origins with `URL`, permit only `http`/`https`, normalize host/port, and define wildcard policy explicitly. Enforce plan limits atomically with a transaction or database function.

#### H-05: Account deletion is not transactionally complete

**Evidence:** `app/api/account/delete/route.ts` deletes verification logs, rate events, projects, subscriptions, and then Auth user, but does not remove `project_members` or `team_invitations`; it ignores intermediate errors.

**Impact:** Foreign-key constraints can prevent project deletion, leaving orphaned data while the Auth user is deleted. The endpoint can report a failure late or create an incomplete privacy deletion.

**Required fix:** Implement a database transaction/function or a controlled deletion job that removes dependent rows in FK order, records failures, and only deletes the Auth user after data deletion succeeds. Include careers/contact/billing retention decisions in the privacy policy rather than silently deleting or retaining them.

#### H-06: Billing webhook validates the Paystack signature but not the event semantics sufficiently

**Evidence:** `app/api/webhooks/paystack/route.ts` verifies the HMAC and records an event, then trusts `metadata.user_id` and maps event data into `subscription_stats`.

**Impact:** A correctly signed but malformed/replayed business event, or an event with metadata for a different account, can update the wrong user or change tier state. The implementation does not visibly verify the transaction amount/currency/product against the selected plan, nor does it use an explicit event state machine.

**Required fix:** Validate event type, user ID format/existence, reference uniqueness, amount, currency, tier, customer identity, and subscription code. Use an idempotent transaction that records raw event and derived state together. Reject unsupported event types safely and retain an audit trail.

#### H-07: Migration history is not reproducible from the repository

**Evidence:** The repository contains 14 SQL migration files, including `20260825052754_init_schema.sql`, blog/contact, careers, hardcore fix, and rate-limit migrations. Live Supabase migration history reports 9 versions with different timestamps and names, including `subscription_plans_and_admin_assignments_v2`, `live_request_metrics`, and `batch1_entitlements_teams_keys`.

**Impact:** A new environment cannot reliably reproduce the live schema by applying repository files in order. Rollback, disaster recovery, and contributor onboarding are all at risk. This also makes it difficult to prove which policy definitions are authoritative.

**Required fix:** Reconcile the live database and repository. Choose one canonical migration history, create a baseline/squash migration for a fresh environment, document the mapping from old to new versions, and make CI run migrations against a disposable database. Never edit an already-applied migration; add corrective migrations.

#### H-08: Auth hardening is incomplete

**Evidence:** Supabase advisor reports leaked-password protection disabled. Repository config has `minimum_password_length = 6`, `password_requirements = ""`, and `enable_confirmations = false`. SMTP is commented out.

**Impact:** Users can choose weak or compromised passwords, and unconfirmed accounts may be usable depending on the application flow. Admin accounts are especially sensitive.

**Required fix:** Enable leaked-password protection, require at least 12 characters or a documented equivalent, enable email confirmation with production SMTP, enforce recent reauthentication for password changes, enable MFA for admins, and document account recovery.

#### H-09: Public endpoints lack abuse controls and payload limits

**Evidence:** Contact, career application, visitor tracking, demo-key, and some auth/billing endpoints are public or semi-public. The career route limits file size but not request frequency. Contact HTML is constructed from user input for outbound email.

**Impact:** Spam, resource exhaustion, email abuse, storage abuse, and downstream provider cost. HTML content can create email-client injection or phishing content even if it does not execute in the application browser.

**Required fix:** Add route-specific rate limits, body-size limits, honeypots/Turnstile where appropriate, strict length limits, HTML escaping or plain-text email templates, content-security controls, and monitoring/alerts.

### Medium findings

#### M-01: RLS policies are redundant and use broad `public` roles

The live advisor reports 54 multiple-permissive-policy findings. Examples include duplicate read policies on `cms_pages` and `plan_pricing`, duplicate project policies, and multiple permissive policies on subscription and metrics tables. Policies should use explicit roles (`anon`, `authenticated`) and one clear predicate per operation. The current broad role model increases review complexity and can make an accidental permissive policy effective.

#### M-02: RLS predicates call `auth.*` per row

The performance advisor reports eight policies that re-evaluate `auth.uid()` or related auth functions per row. Replace expressions such as `auth.uid() = user_id` with `(select auth.uid()) = user_id` where supported, and centralize membership checks in stable helper functions.

#### M-03: Foreign-key indexes are incomplete

The performance advisor reports missing covering indexes for `projects.user_id` and `team_invitations.invited_by`. Add indexes based on query patterns and verify with `EXPLAIN (ANALYZE, BUFFERS)` in staging. The advisor also reports unused indexes; do not remove them without workload evidence.

#### M-04: Admin user listing is capped at the first 1,000 users

`app/api/admin/data/route.ts` calls `auth.admin.listUsers({ page: 1, perPage: 1000 })` and does not paginate. The dashboard will silently become incomplete at scale. Add cursor/page pagination and server-side search.

#### M-05: Analytics and admin queries are unbounded in several branches

Some admin queries use `select("*")` without limits, particularly messages, applications, pricing, admins, and projects. Add explicit field lists, pagination, maximum page sizes, and server-side filters. Avoid returning CV URLs or billing payloads unless the current view requires them.

#### M-06: Observability and failure handling are incomplete

Many Supabase errors are ignored. Add structured logs with request IDs, provider/database latency, rate-limit decisions, authorization failures, and webhook outcomes. Do not log raw secrets, tokens, CV contents, or full payment payloads.

#### M-07: Repository hygiene needs improvement

Tracked files include `app/globals.css.bak` and `secrets-to-nuke.txt`. The latter is redacted now, but secret-remediation artifacts should not remain in the main tree. Remove backups and move remediation notes into private incident records. Add secret scanning in CI with Gitleaks or GitHub secret scanning.

#### M-08: Build and lint baseline is not clean

TypeScript passes and integration contract tests pass. The smoke test is skipped without `SMOKE_API_KEY` and `SMOKE_SECRET_KEY`. ESLint reports pre-existing hook/state, `any`, unescaped entity, and Next link issues. The production build previously failed in this environment because the optional native `lightningcss` binary was missing from installed dependencies. Make CI install optional native dependencies correctly and require a clean lint/build baseline before release.

## Supabase live-state review

### Confirmed healthy or correctly implemented

- Project status is `ACTIVE_HEALTHY` on Supabase Postgres 17.
- The expected product tables are present.
- RLS is enabled on all reported public tables.
- The `careers` storage bucket is private.
- `projects.api_key` and `projects.secret_key` have unique indexes.
- `project_members(project_id, user_id)` has a uniqueness constraint.
- The secret-revocation columns exist in the live schema.
- Audit logs, billing events, cron history, verification logs, and rate-limit event tables are populated, demonstrating active platform flows.

### Not fully confirmed from repository/live inspection

The following require a Supabase dashboard or operational access check beyond the database metadata available to this audit:

- Production Auth SMTP delivery and sender reputation.
- MFA enforcement and admin-only MFA policy.
- Password leak protection setting after remediation.
- Auth redirect URLs and custom domains in every deployment environment.
- Point-in-time recovery, backup retention, restore drills, and database alerting.
- Edge/CDN/WAF configuration and provider-level request limits.
- Storage object policies beyond bucket visibility metadata.
- Postgres role grants outside the exposed public schema.

These should be added to a deployment-readiness checklist and verified with screenshots or exported configuration in a private operations record.

## Documentation assessment

The repository has useful documents: `README.md`, `SECURITY.md`, `AUDIT_REPORT.md`, `PROJECT_CLOSEOUT_AUDIT.md`, `LAUNCH_CHECKLIST.md`, `FEATURE_ROADMAP.md`, `VERCEL_ENV_VARS.md`, `CONTRIBUTING.md`, and `CHANGELOG.md`. The environment-variable document is particularly helpful and correctly distinguishes server-only keys, public Paystack keys, preview isolation, and the need for separate secrets.

Documentation is incomplete in these areas:

1. **Live schema contract:** There is no authoritative table-by-table data dictionary describing owners, retention, PII, RLS policy, indexes, and service-role-only writes.
2. **Threat model:** The project needs an explicit attacker model for public verification, stolen API keys, stolen secret keys, malicious project members, admin compromise, webhook spoofing, and Supabase service-role compromise.
3. **Migration procedure:** The mismatch between repository and live migration history is not documented or resolved.
4. **Incident response:** Add key rotation, webhook compromise, account deletion failure, leaked service-role key, and database restore runbooks.
5. **Privacy and retention:** Document IP hashing, verification-log retention, CV retention/deletion, billing payload retention, and user deletion guarantees.
6. **Local development:** Provide a one-command local Supabase setup, seed data, test accounts, and a safe demo environment.
7. **Security disclosure:** Add `SECURITY.md` with supported versions, private reporting instructions, response targets, and safe-harbor language.
8. **API reference:** Document request/response schemas, authentication, error codes, quotas, CORS, idempotency, and rate-limit headers.

## Recommended remediation plan

### Phase 0: Contain and protect

1. Remove the public subscription insert, rate-limit-event `ALL`, request-metrics `ALL`, and public security-definer execution grants.
2. Enable leaked-password protection and raise password requirements.
3. Rotate any project secrets that may have been stored in plaintext and remove legacy fallback after a defined migration window.
4. Upgrade Next.js and Sharp to patched versions.
5. Remove tracked backup/secret-remediation artifacts and enable secret scanning.

### Phase 1: Establish database authority

1. Reconcile migration history and create a clean baseline for new environments.
2. Define explicit `anon`, `authenticated`, and `service_role` policies for every table.
3. Add membership-aware policies for project members, invitations, logs, and team data.
4. Add missing foreign-key indexes and optimize RLS expressions.
5. Add SQL security tests that assert no sensitive table has an unintended public write policy.

### Phase 2: Harden application routes

1. Create shared Zod schemas for every API body and query parameter.
2. Centralize authentication and authorization helpers, including owner/member/admin capabilities.
3. Replace multi-step destructive flows with transactions or server-side database functions.
4. Implement atomic rate limiting and route coverage.
5. Validate billing event semantics and make state transitions idempotent.
6. Add payload-size and field-length limits, email escaping, and upload scanning/processing isolation.

### Phase 3: Testing and operations

1. Add Vitest/contract tests for every authorization boundary and negative RLS case.
2. Run smoke tests in CI against an isolated Supabase project.
3. Add Playwright coverage for login, project creation, challenge/verify, billing, team invite/accept, admin actions, and mobile navigation.
4. Add dependency, secret, license, and CodeQL scanning to GitHub Actions.
5. Add request IDs, metrics, alerts, and dashboards for auth failures, rate-limit spikes, webhook failures, and database errors.
6. Perform a restore drill and document RTO/RPO.

## Open-source feature and product improvements

The following additions would make the project more useful and safer for contributors and adopters:

| Feature | Value | Suggested implementation |
|---|---|---|
| Official SDKs | Easier adoption | Publish typed TypeScript, Python, and Go clients with retries and typed errors |
| Webhook/event framework | Extensibility | Signed outbound events with replay protection, event IDs, and delivery logs |
| Policy simulator | Safer configuration | Preview score thresholds, IP/origin rules, and shadow-mode outcomes before activation |
| Explainable decisions | Trust | Return a redacted reason code and decision trace without exposing scoring internals |
| Project member permissions | Enterprise readiness | Owner/admin/developer/analyst/viewer capabilities enforced in API and RLS |
| Key management | Security | Versioned keys, one-time reveal, rotation jobs, revocation status, and KMS-backed encryption |
| Quota ledger | Billing correctness | Append-only usage ledger with atomic monthly allocation and reconciliation |
| Abuse review workflow | Operations | Case assignment, decision notes, false-positive feedback, and retention controls |
| Privacy controls | Compliance | Data export, deletion status, retention settings, and regional storage options |
| Local demo stack | Contributor experience | Docker/Supabase seed, fake billing provider, demo users, and deterministic fixtures |
| Observability integrations | Production operations | OpenTelemetry traces, Prometheus metrics, Sentry-compatible errors |
| Accessibility and i18n | Broader adoption | Keyboard navigation, screen-reader labels, reduced motion, and translation resources |
| Security test corpus | Research | Versioned bot/human fixtures, adversarial payloads, and benchmark scoring |
| Governance | Community health | Maintainers file, CODEOWNERS, release policy, changelog automation, and RFC process |

## Pull-request acceptance checklist

- [ ] Security-definer grants are least-privilege and search paths are fixed.
- [ ] No public policy permits writes to subscription, metrics, rate-limit, admin, billing, or team data.
- [ ] All sensitive tables have explicit documented RLS policies.
- [ ] Migrations apply cleanly to a fresh database and match the live baseline.
- [ ] Next.js and Sharp are on patched versions.
- [ ] API inputs use shared schemas and enforce size/range/format constraints.
- [ ] Rate limiting is atomic and covered by concurrency tests.
- [ ] Billing transitions are idempotent and validate user/plan/amount/currency.
- [ ] Account deletion is transactional and tested for dependent rows.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, integration tests, and smoke tests pass in CI.
- [ ] Secret scanning, dependency scanning, and CodeQL are enabled.
- [ ] Documentation includes threat model, schema/RLS matrix, migration procedure, incident response, and privacy retention.

## Validation evidence collected

- `npx tsc --noEmit`: **passed**.
- `npm run test:integration`: **passed** (`Integration contract tests passed`).
- Smoke test: **skipped** because `SMOKE_API_KEY` and `SMOKE_SECRET_KEY` are not configured.
- `npm audit --omit=dev --audit-level=moderate`: **failed**, reporting one critical Next.js issue and one high Sharp issue.
- Supabase project status: **ACTIVE_HEALTHY**.
- Supabase security advisors: findings recorded above.
- Supabase performance advisors: findings recorded above.
- Supabase storage inspection: `careers` bucket is private.
- No destructive Supabase operation was performed.

## Final conclusion

BotShield is a promising, feature-rich foundation with meaningful security work already started. The main gap is not the absence of features; it is the lack of a single, enforced authorization model across application routes, Supabase RLS, RPC privileges, and migrations. Close the critical findings first, especially subscription/rate-limit/metrics writes, security-definer execution, migration drift, dependency vulnerabilities, and secret storage. Once those controls are covered by automated negative tests and a reproducible local stack, the project will be in a much stronger position for public open-source adoption and production use.

## Reference links

- [Supabase database linter](https://supabase.com/docs/guides/database/database-linter)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security)
- [Supabase security best practices](https://supabase.com/docs/guides/database/secure-data)
- [GitHub Advisory Database](https://github.com/advisories)
