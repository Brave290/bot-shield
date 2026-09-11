# BotShield Vercel environment variables

Add these variables in **Vercel → Project Settings → Environment Variables**. Use the Production, Preview, and Development environments deliberately; do not expose server-only secrets with a `NEXT_PUBLIC_` prefix.

| Variable | Required | Scope | Value |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public client | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only | Supabase service-role key; never expose to browsers |
| `NEXT_PUBLIC_APP_URL` | Yes | Public client | Production URL, for example `https://bo-tshield.vercel.app` |
| `ADMIN_EMAILS` | Yes | Server only | Comma-separated initial admin emails |
| `ADMIN_ALLOWED_IPS` | Optional | Server only | Comma-separated administrator IP allowlist; use with MFA and a trusted network |
| `ADMIN_API_KEY` | Recommended | Server only | Long random value for protected CMS/admin integrations |
| `CRON_SECRET` | Recommended | Server only | Long random value used to authenticate scheduled jobs |
| `BOTSHIELD_SECRET` | Recommended | Server only | Long random application secret; do not use as a project secret key |
| `PAYSTACK_SECRET_KEY` | For billing | Server only | Paystack secret key, preferably the live key only in Production |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | For browser checkout | Public client | Paystack public key; safe to expose, unlike the secret key |
| `PAYSTACK_WEBHOOK_SECRET` | Optional | Server only | Add if a separate webhook signing secret is enabled in your billing setup |
| `BASE_URL` | Preview/tests | Server only | URL used by smoke tests, usually the deployed preview URL |
| `SMOKE_API_KEY` | Tests only | Server only | A dedicated non-production project public key |
| `SMOKE_SECRET_KEY` | Tests only | Server only | The matching dedicated non-production secret key |
| `SMOKE_ALLOWED_ORIGIN` | Tests only | Server only | Exact origin allowed for the staging smoke project |
| `BOTSHIELD_FAIL_OPEN` | Optional | Server only | Default outage posture: `true` keeps users flowing during internal outages; `false` returns `503` when verification infrastructure is unavailable |

## Recommended values by environment

**Production** should use the production Supabase project, production `NEXT_PUBLIC_APP_URL`, live Paystack secret/public keys, and unique random `ADMIN_API_KEY`, `CRON_SECRET`, and `BOTSHIELD_SECRET` values.

**Preview** should use a staging Supabase project or a deliberately isolated schema, a preview URL, Paystack test keys, and separate random server secrets. Do not reuse production service-role keys in Preview.

**Development** can use local Supabase or a non-production Supabase project, `http://localhost:3000`, Paystack test keys, and local random secrets.

## Where to get each value

1. **Supabase URL and anon key:** open the Supabase project, select **Project Settings → Data API**, and copy the **Project URL** and **Publishable/anon key**. For the service role key, open **Project Settings → API Keys**, reveal the secret service-role key, and add it only as `SUPABASE_SERVICE_ROLE_KEY`.
2. **Database schema:** the repository migrations are already applied to the connected BotShield Supabase project. For a separate staging project, run the repository migrations with the Supabase CLI or apply the SQL files in `supabase/migrations` in order.
3. **Application URL:** use the exact deployed Vercel URL for `NEXT_PUBLIC_APP_URL`, with no trailing slash. Add custom domains after DNS is working, then update this value.
4. **Admin emails:** put the email addresses that are allowed into `ADMIN_EMAILS`, separated by commas. The account must also exist in Supabase Auth.
5. **Random server secrets:** generate each value locally with `openssl rand -hex 32`. Do not reuse one secret for multiple variables.
6. **Paystack keys:** create or open a Paystack account, use **Settings → API Keys & Webhooks**, and copy the public key into `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and the secret key into `PAYSTACK_SECRET_KEY`. Use test keys for Preview and Development; use live keys only for Production.
7. **Paystack webhook:** in the same Paystack screen, add `https://YOUR-VERCEL-DOMAIN/api/webhooks/paystack` as the webhook URL. Send a test event and check Vercel Runtime Logs for a successful response.
8. **Smoke-test keys:** create a separate non-production BotShield project, copy its public key into `SMOKE_API_KEY` and secret key into `SMOKE_SECRET_KEY`, and set `BASE_URL` to the staging/preview URL. Never use a production secret in automated tests.

## Getting smoke keys

1. Sign in to the BotShield dashboard and create a project named something like `staging-smoke`.
2. Set its allowed origin to the staging URL used by the smoke workflow, for example `https://staging.example.com`.
3. Open that project’s SDK/API panel. Copy the public `bs_live_...` key into the GitHub Actions secret `SMOKE_API_KEY`.
4. Copy the matching server-only `bs_sec_...` secret into the GitHub Actions secret `SMOKE_SECRET_KEY`. Never put this value in HTML, browser JavaScript, an issue, or a repository file.
5. Set `SMOKE_ALLOWED_ORIGIN` to the exact staging origin and set `BASE_URL` to the deployed staging URL.
6. Run the workflow. The live security harness checks a realistic human, a high-risk bot, replay protection, and origin rejection. Set `RUN_RATE_LIMIT=true` only when you intentionally want the additional rate-limit test.

If the dashboard does not yet display the secret key, use the project creation response or the one-time rotation response immediately and save the value in the secret manager. Secrets are intentionally not recoverable after they are hidden.

## Add them in Vercel

Open **Vercel → your BotShield project → Settings → Environment Variables → Add New**. Enter the variable name exactly, paste the value, select the target environment, and save. Add all server secrets to **Production** and **Preview** separately with different values. After saving, go to **Deployments**, open the latest deployment, choose **Redeploy**, and enable **Use existing Build Cache** only if you did not change public variables; otherwise redeploy without the cache.

After deployment, verify `/api/stats/realtime`, the homepage live simulation, login, project creation, and the Paystack webhook test. Never test by printing secret values in browser code or committing a filled `.env` file.

Project-level privacy, consent, retention, accessibility, provider, and fail-open settings are managed through the authenticated `/api/projects/security-settings` endpoint. The default provider is `none`; selecting `webhook` only enables the customer-configured HTTPS webhook path. BotShield does not silently activate third-party reputation, advertising, or data-broker services.

## Generate random secrets

```bash
openssl rand -hex 32
```

Use a different generated value for `ADMIN_API_KEY`, `CRON_SECRET`, and `BOTSHIELD_SECRET`. Never commit `.env.local`, service-role keys, Paystack secret keys, or project secret keys.

## Billing webhook

Configure Paystack’s webhook URL as:

```text
https://YOUR_VERCEL_DOMAIN/api/webhooks/paystack
```

The checkout metadata includes `user_id` and `tier`. The webhook verifies the Paystack signature, records an idempotent billing event, and updates the user subscription.
