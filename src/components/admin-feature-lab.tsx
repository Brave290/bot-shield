"use client";
import { motion } from "framer-motion";
import { Icon } from "@/components/icons";

type Tab = "overview" | "messages" | "applications" | "pricing" | "users" | "rules" | "admins" | "audit" | "cron" | "cms" | "features" | "billing" | "abuse";
type Feature = [string, string, "Live" | "Next", string, Tab?];
const FEATURES: Feature[] = [
  // === Existing Features (20) ===
  ["User directory", "Search, inspect, assign plans, and permanently remove accounts.", "Live", "users", "users"],
  ["Plan control center", "Update pricing, enforce monthly quotas, and manage customer entitlements.", "Live", "file", "pricing"],
  ["Project security rules", "Manage shadow mode, IP allowlists, blocklists, and limits.", "Live", "shield", "rules"],
  ["Audit trail", "Review sensitive actions with actor, time, target, and IP context.", "Live", "file", "audit"],
  ["Scheduled jobs", "Run and inspect maintenance, retention, and sync jobs.", "Live", "activity", "cron"],
  ["Content operations", "Edit public content, blogs, and careers from the CMS.", "Live", "book", "cms"],
  ["Rate-limit center", "Tune abuse controls by endpoint and request scope.", "Live", "zap"],
  ["Platform settings", "Manage maintenance mode and notification configuration.", "Live", "settings"],
  ["Analytics workspace", "Monitor traffic, requests, conversion, and bot pressure.", "Live", "trending"],
  ["Billing event monitor", "Track successful, duplicate, failed, and pending payments.", "Live", "chart", "billing"],
  ["Team access", "Invite members, accept invitations, and assign project roles.", "Live", "users"],
  ["Key rotation center", "Rotate, expire, and revoke project secrets with migration protection.", "Live", "shield"],
  ["Origin policy manager", "Review and approve customer website origins.", "Live", "shield"],
  ["Webhook monitor", "Inspect delivery health and replay failed callbacks.", "Live", "activity"],
  ["Email delivery", "Test, monitor, and troubleshoot transactional email.", "Live", "mail"],
  ["Abuse review queue", "Review blocked verification events, fingerprints, and false positives.", "Live", "activity", "abuse"],
  ["Feature flags", "Release platform features progressively by plan or cohort.", "Live", "settings"],
  ["Data export center", "Export users, logs, billing, and audit data safely.", "Live", "file"],
  ["Incident center", "Record outages, mitigations, and customer-impact timelines.", "Live", "activity"],
  ["System health", "Track API latency, database health, queues, and uptime.", "Live", "chart"],

  // === New Features (20) ===
  ["Webhook delivery & replay", "Send signed events for blocked traffic with replay controls.", "Live", "activity"],
  ["Alert policies", "Notify teams when metrics cross configurable thresholds.", "Live", "zap"],
  ["Advanced analytics filters", "Filter traffic by project, country, ASN, device, browser, score.", "Live", "trending"],
  ["Decision explanations", "Show signals and score components behind each allow/block decision.", "Live", "file"],
  ["IP/ASN/country controls", "Reusable allowlists, denylists, geofences, and threat feeds.", "Live", "shield"],
  ["Bot fingerprint history", "Track recurring automation fingerprints across projects.", "Live", "activity"],
  ["Shadow mode & rollout", "Observe-only deployments, percentage rollouts, auto-rollback.", "Live", "shield"],
  ["Custom branded verification", "Enterprise logo, colors, copy, and support links.", "Next", "settings"],
  ["Framework SDKs", "Published packages for Next.js, React, Vue, Laravel, Django, Go.", "Next", "book"],
  ["Synthetic traffic testing", "Generate controlled human-like and automated test traffic.", "Live", "flask"],
  ["Incident investigation", "Bundle related requests, notes, evidence into incident records.", "Live", "activity"],
  ["Audit exports", "Export immutable audit logs in CSV and JSON formats.", "Live", "file"],
  ["SLA & status visibility", "Uptime history, incident notices, maintenance windows.", "Live", "chart"],
  ["Model feedback loop", "Label false positives/negatives to improve detection rules.", "Live", "trending"],
  ["Privacy & retention controls", "Telemetry minimization, regional processing, retention windows.", "Live", "settings"],
  ["Quota ledger", "Append-only usage ledger with atomic monthly allocation.", "Live", "chart"],
  ["Policy simulator v2", "Preview score thresholds, IP/origin rules before activation.", "Live", "flask"],
  ["Multi-language SDKs", "Python, Go, Ruby clients with typed errors and retries.", "Next", "book"],
  ["Team permissions v2", "Owner/admin/developer/analyst/viewer enforced in API and RLS.", "Live", "users"],
  ["Observability integrations", "OpenTelemetry traces, Prometheus metrics, Sentry errors.", "Next", "trending"],

  // === New Products (10) ===
  ["BotShield Scanner", "Automated vulnerability scanner for bot protection.", "Live", "shield"],
  ["BotShield WAF", "Managed web application firewall with bot rules.", "Live", "shield"],
  ["BotShield Proxy", "Reverse proxy with built-in bot detection.", "Live", "globe"],
  ["BotShield API Shield", "API gateway with rate limiting and bot scoring.", "Live", "zap"],
  ["BotShield Identity", "Passwordless auth with bot-checked login sessions.", "Live", "users"],
  ["BotShield Analytics Pro", "Standalone traffic intelligence dashboard.", "Live", "trending"],
  ["BotShield Compliance", "SOC2/GDPR audit trail and compliance reports.", "Live", "file"],
  ["BotShield Test Lab", "Synthetic bot traffic generator for QA teams.", "Live", "flask"],
  ["BotShield Edge", "Edge-deployed detection on Cloudflare Workers/Deno.", "Live", "globe"],
  ["BotShield Marketplace", "Community rules, fingerprints, and threat feeds.", "Live", "book"],
];

export function AdminFeatureLab({ onJump }: { onJump: (tab: Tab) => void }) {
  return <div className="space-y-6"><div><div className="mb-3 flex items-center gap-3"><span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">{FEATURES.length} modules</span><span className="text-xs text-slate-500">Control-plane roadmap</span></div><h2 className="font-serif text-3xl font-bold text-white">Admin capability map</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">A single operating view for the features that make BotShield manageable at company scale. Live modules open existing workspaces; next modules are staged for the next implementation batches.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{FEATURES.map(([title, description, status, icon, target], index) => <motion.button key={title} onClick={() => target && onJump(target)} className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left transition hover:-translate-y-1 hover:border-blue-500/40"><div className="mb-5 flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Icon name={icon} className="h-5 w-5" /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status === "Live" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>{status}</span></div><p className="mb-1 text-xs text-slate-600">{String(index + 1).padStart(2, "0")}</p><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p></motion.button>)}</div></div>;
}
