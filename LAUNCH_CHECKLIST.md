# BotShield launch checklist

This checklist covers the final work required before accepting production traffic. Mark each item complete in staging first, then repeat the checks against the production domain.

## Authentication

- Configure Supabase email confirmation and redirect URLs for the production domain.
- Verify sign-up, confirmation, sign-in, sign-out, forgotten-password, password reset, and expired-session behavior.
- Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are configured only in the appropriate Vercel environments.
- Confirm the service-role key never appears in browser bundles or public logs.

## API and security

- Verify challenge and verification requests from an external test domain.
- Verify malformed payloads return `400`, invalid keys return `401`, blocked requests return `403`, and rate-limited requests return `429`.
- Confirm private dashboard and admin endpoints do not return wildcard CORS headers.
- Confirm project ownership checks for every project read, update, analytics, and delete operation.
- Confirm Paystack webhook signatures are validated and duplicate events are idempotent.
- Confirm careers uploads reject oversized, renamed, malformed, and disallowed files.

## Database and storage

- Apply all migrations in `supabase/migrations` in order.
- Confirm the `careers` bucket is private and public object policies are absent.
- Confirm `cron_job_history` exists and old `ping_history` is removed.
- Confirm `demo_keys_ip` is enabled with the intended threshold.
- Test a database backup and restore procedure before launch.

## Cron and monitoring

- Confirm Vercel recognizes `/api/cron/daily` and runs it on schedule.
- Confirm `CRON_SECRET` is set and unauthorized Cron requests return `401`.
- Confirm successful and failed runs appear in the Cron jobs admin section.
- Monitor `/api/health`, `/api/challenge`, `/api/verify`, and `/api/cron/daily` with an uptime service.
- Add an error-monitoring provider before broad public traffic. Do not put provider credentials in the client.

## Product readiness

- Complete the first-run onboarding path: create account, create project, install SDK, run a test, and view analytics.
- Add and test API-key rotation before publishing paid plans.
- Connect project settings fields to an authenticated save endpoint.
- Define plan limits, usage reset rules, failed-payment behavior, and cancellation behavior.
- Verify Paystack webhook events upgrade and downgrade subscriptions idempotently.
- Publish SDK examples for plain HTML, Next.js, React, Node, PHP, and Laravel.

## Privacy and support

- Publish telemetry, retention, IP hashing, fingerprinting, and deletion behavior.
- Confirm account deletion removes projects, logs, rate-limit events, and stored files owned by the user.
- Publish a real security contact address and support response target.
- Add a public status page or incident communication process.
- Document data retention and backup restoration procedures.

## Release gate

Do not announce the public launch until the critical sections above have been tested against the production domain and a rollback owner has been assigned. Record the deployment commit, migration state, environment-variable review, and smoke-test result in the release notes.
