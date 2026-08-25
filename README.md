<div align="center">

<img src="app/icon.svg" width="80" height="80" alt="BotShield" />

# BotShield

**Enterprise-grade bot detection for the modern web.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Production-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-F59E0B?style=flat-square)](LICENSE)

[Website](https://bo-tshield.vercel.app) · [Documentation](https://bo-tshield.vercel.app/docs) · [API Playground](https://bo-tshield.vercel.app/test) · [BraveHX Studio](https://bravehx.online)

</div>

---

## Overview

BotShield is a behavioral bot-detection platform that replaces challenge-based verification (CAPTCHA) with silent behavioral analysis. A lightweight client widget (< 5 KB) scores visitor interaction patterns — pointer kinematics, keystroke dynamics, and session timing — and issues short-lived, cryptographically signed tokens that integrating backends verify with a single API call.

Legitimate users experience zero friction. Automated traffic is identified and blocked.

## How it works

1. **Observe** — The widget collects behavioral telemetry in the browser without interrupting the user.
2. **Score** — The scoring engine evaluates the session against known automation signatures (0–100).
3. **Issue** — Sessions scoring as human receive a signed JWT with a 5-minute expiry.
4. **Verify** — The integrating server confirms token authenticity server-to-server using its secret key.

## Features

- Behavioral scoring engine: pointer kinematics, keystroke dynamics, timing heuristics
- Signed verification tokens (HS256, short expiry, per-project secrets)
- Per-project API keys with rotation and revocation
- Real-time analytics streamed from production telemetry
- Configurable rate limiting scoped by IP, email, and API key
- Role-based administration (owner / admin) with ownership transfer
- Multi-tier subscription model (Hobby, Pro, Enterprise)
- Fail-open verification path for maximum availability
- Privacy-preserving by design: SHA-256 hashed identifiers, no tracking cookies

## Integration

### Client

```html
<script src="https://bo-tshield.vercel.app/bot-shield.js"
        data-api-key="YOUR_PUBLIC_KEY"></script>
```

The widget derives its API origin from its own script URL, so deployments on custom domains require no code changes.

### Server

```js
const res = await fetch("https://bo-tshield.vercel.app/api/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ secretKey: process.env.BOTSHIELD_SECRET, token }),
});
const { status } = await res.json(); // "human" | "blocked"
```

Full reference, sensitivity presets, and error-handling guidance: [Documentation](https://bo-tshield.vercel.app/docs).

## Self-hosting

**Requirements:** Node.js 18+, a Supabase project.

```bash
git clone https://github.com/brave290/bot-shield
cd bot-shield
npm install
cp .env.example .env.local   # configure Supabase, Resend, and admin keys
npm run dev
```

Environment variables are documented in [`.env.example`](.env.example).

## Security

- Row-Level Security enforced on all database tables
- Service-role credentials never exposed to the client
- Rate limiting on authentication and verification endpoints
- Admin operations verified server-side against an administrators table

Vulnerability reports: `info.bravehx@gmail.com` (subject `SECURITY`). Acknowledgment within 48 hours.

## Roadmap

- Stripe billing integration for paid tiers
- Machine-learning scoring models layered on the rule engine
- Per-project analytics breakdowns
- Shadow (observe-only) deployment mode

## Company

BotShield is a product of **BraveHX Studio**, a subsidiary of **Brave HX Technology**.

## License

Distributed under the MIT License. See [LICENSE](LICENSE).
