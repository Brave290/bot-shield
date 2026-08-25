<div align="center">

<img src="app/icon.svg" width="96" height="96" alt="BotShield logo" />

# 🛡️ BotShield

**Master your security with *intelligence*. Protect your users today.**

Enterprise-grade bot detection for the modern web. Behavioral analysis, cryptographic tokens, real-time analytics — zero CAPTCHA nonsense.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)

**🌐 Live:** [https://bo-tshield.vercel.app](https://bo-tshield.vercel.app) · **🎨 Studio:** [https://bravehx.online](https://bravehx.online)

</div>

---

## ✨ Why BotShield?

CAPTCHA asks people to prove they're human. **BotShield already knows — because robots can't move like you.**

| | 🧩 Traditional CAPTCHA | 🛡️ BotShield |
|---|---|---|
| User experience | Puzzles & checkboxes | Invisible, zero friction |
| Setup | SDKs + styling + callbacks | One script tag |
| Privacy | Trackers & fingerprinting | No cookies, hashed IPs |
| Bot resistance | Solved by AI & farms | Behavioral physics |
| Page weight | Hundreds of KB | Under 5KB |

## ⚡ Quickstart

```html
<script src="https://bo-tshield.vercel.app/bot-shield.js"
        data-api-key="bs_live_your_key"></script>
```

Verify on your backend:

```js
const res = await fetch("https://bo-tshield.vercel.app/api/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ secretKey, token })
});
const { status } = await res.json(); // "human" | blocked
```

## 🧠 How it works

1. **Observe** — the widget silently scores pointer physics & typing rhythm.
2. **Issue** — humans receive a short-lived signed JWT wristband (5 min expiry).
3. **Verify** — your server confirms the wristband with one call. Bots can't forge it.

## 🧰 Features

- 🪶 Sub-5KB widget, fail-open design
- 🔐 HS256 signed tokens, per-project secrets, key rotation
- 📊 Real-time analytics streamed from production Postgres
- 🚦 Admin-editable rate limiting (logins, signups, API abuse)
- 👥 Role-based admin console (owner / admin) with ownership transfer
- 💼 Tiered SaaS dashboard (Hobby / Pro / Enterprise) with grace upgrades
- 🌍 Domain-adaptive widget — move domains without touching code
- 🌗 Light/dark theme, WCAG-minded, reduced-motion aware

## 🏗️ Self-host

```bash
git clone https://github.com/brave290/bot-shield
cd bot-shield
npm install
cp .env.example .env.local   # fill your Supabase + Resend keys
npm run dev
```

## 🔑 Environment

See [`.env.example`](.env.example) — Supabase URL/keys, `RESEND_API_KEY`, `ADMIN_API_KEY`, `ADMIN_EMAILS`.

## 🗺️ Roadmap

- 💳 Stripe checkout for Pro upgrades
- 🤖 ML scoring models on top of rule-based engine
- 📈 Per-project analytics breakdowns
- ️ Shadow mode (observe-only rollout)

## 🏢 About

A product of **BraveHX Studio**, a subsidiary of **Brave HX Technology**.
Built by [Mus'ab (brave290)](https://github.com/brave290) — designed and shipped from a phone. 📱

## 📄 License

MIT — see [LICENSE](LICENSE).

<div align="center">

**[Live Demo](https://bo-tshield.vercel.app)** · [Docs](https://bo-tshield.vercel.app/docs) · [API Playground](https://bo-tshield.vercel.app/test) · [Contact](https://bo-tshield.vercel.app/contact)

</div>
