<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BotShield Agent Instructions

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev          # starts on localhost:3000
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | TypeScript check |
| `npm run smoke` | Smoke tests (needs SMOKE_API_KEY + SMOKE_SECRET_KEY) |
| `npm run test:integration` | Integration contract tests |

**Run `npx tsc --noEmit` before committing.** TypeScript must pass clean.

## Architecture

- **Framework:** Next.js 16 App Router + React 19 + TypeScript
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Payments:** Paystack
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React + custom SVG icons in `src/components/site.tsx`

### Directory structure

```
app/                    # Next.js App Router pages and API routes
  api/                  # API endpoints (challenge, verify, admin, auth, billing, etc.)
  dashboard/            # User dashboard pages
  admin/                # Admin console
  (marketing)/          # Public pages (features, pricing, docs, etc.)
src/
  components/           # Shared React components
    layouts/            # DashboardShell layout
    dashboard/          # Dashboard-specific views (sdk-view, projects-view)
  lib/                  # Shared libraries
    supabase/server.ts  # Service-role Supabase client (SERVER ONLY)
    admin.ts            # Admin auth helper (getAdmin)
    rate-limit.ts       # Rate limiting via consume_rate_limit RPC
    scoring-engine.ts   # Bot scoring algorithm
    bot-type.ts         # Bot classification
    crypto.ts           # Secret hashing utilities
lib/                    # Alternate lib path (scoring-engine, bot-type, supabase)
supabase/migrations/    # SQL migrations (apply in order)
public/bot-shield.js    # Client-side SDK widget
scripts/                # Test scripts (smoke, integration, security)
```

### Key API routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/challenge` | POST | API key | Score behavior, issue JWT |
| `/api/verify` | POST | Secret key | Verify token server-side |
| `/api/admin/data` | GET/POST/PATCH | Admin | All admin operations |
| `/api/auth/login` | POST | None | User login |
| `/api/auth/signup` | POST | None | User signup |
| `/api/webhooks/paystack` | POST | Signature | Billing webhook |
| `/api/account/delete` | POST | Bearer token | Account deletion |
| `/api/contact` | POST | Rate limited | Contact form |
| `/api/careers/apply` | POST | Rate limited | Job application |

## Security rules

- **Never** use the service-role key in client components
- **Never** log or return secret keys from API responses
- All admin operations go through `getAdmin()` in `src/lib/admin.ts`
- Rate limiting uses `consume_rate_limit` RPC — hash all scope keys
- Challenge tokens are signed JWTs with 5-minute expiry
- IP addresses are SHA-256 hashed before storage
- RLS is enforced on all Supabase tables via service-role client

## Common gotchas

- `src/lib/supabase/server.ts` is the **server-only** Supabase client (service role). Do not import in client components.
- `lib/` and `src/lib/` both exist — prefer `src/lib/` for new code
- The `zod` package is installed — use it for API payload validation
- Environment variables: `.env.local` (never commit), `.env.example` (template)
- The `bot-shield.js` client SDK must remain self-contained and < 5KB

## Deployment

- **Platform:** Vercel
- **Cron:** Daily job at `/api/cron/daily` via `vercel.json`
- **Domain:** `bo-tshield.vercel.app`
- Environment variables documented in `VERCEL_ENV_VARS.md`
