"use client";
import { motion } from "framer-motion";
import { Icon } from "@/components/icons";

type Tab = "overview" | "messages" | "applications" | "pricing" | "users" | "rules" | "admins" | "audit" | "cron" | "cms" | "features";
type Feature = [string, string, "Live" | "Next", string, Tab?];
const FEATURES: Feature[] = [
  ["User directory", "Search, inspect, assign plans, and permanently remove accounts.", "Live", "users", "users"],
  ["Plan control center", "Update pricing, enforce monthly quotas, and manage customer entitlements.", "Live", "file", "pricing"],
  ["Project security rules", "Manage shadow mode, IP allowlists, blocklists, and limits.", "Live", "shield", "rules"],
  ["Audit trail", "Review sensitive actions with actor, time, target, and IP context.", "Live", "file", "audit"],
  ["Scheduled jobs", "Run and inspect maintenance, retention, and sync jobs.", "Live", "activity", "cron"],
  ["Content operations", "Edit public content, blogs, and careers from the CMS.", "Live", "book", "cms"],
  ["Rate-limit center", "Tune abuse controls by endpoint and request scope.", "Live", "zap"],
  ["Platform settings", "Manage maintenance mode and notification configuration.", "Live", "settings"],
  ["Analytics workspace", "Monitor traffic, requests, conversion, and bot pressure.", "Live", "trending"],
  ["Billing event monitor", "Track successful, duplicate, failed, and pending payments.", "Next", "chart"],
  ["Team access", "Invite members, accept invitations, and assign project roles.", "Live", "users"],
  ["Key rotation center", "Rotate, expire, and revoke project secrets with migration protection.", "Live", "shield"],
  ["Origin policy manager", "Review and approve customer website origins.", "Next", "shield"],
  ["Webhook monitor", "Inspect delivery health and replay failed callbacks.", "Next", "activity"],
  ["Email delivery", "Test, monitor, and troubleshoot transactional email.", "Next", "mail"],
  ["Abuse review queue", "Triage suspicious traffic, fingerprints, and false positives.", "Next", "activity"],
  ["Feature flags", "Release platform features progressively by plan or cohort.", "Next", "settings"],
  ["Data export center", "Export users, logs, billing, and audit data safely.", "Next", "file"],
  ["Incident center", "Record outages, mitigations, and customer-impact timelines.", "Next", "activity"],
  ["System health", "Track API latency, database health, queues, and uptime.", "Next", "chart"],
];

export function AdminFeatureLab({ onJump }: { onJump: (tab: Tab) => void }) {
  return <div className="space-y-6"><div><div className="mb-3 flex items-center gap-3"><span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">20 modules</span><span className="text-xs text-slate-500">Control-plane roadmap</span></div><h2 className="font-serif text-3xl font-bold text-white">Admin capability map</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">A single operating view for the features that make BotShield manageable at company scale. Live modules open existing workspaces; next modules are staged for the next implementation batches.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{FEATURES.map(([title, description, status, icon, target], index) => <motion.button key={title} onClick={() => target && onJump(target)} className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left transition hover:-translate-y-1 hover:border-blue-500/40"><div className="mb-5 flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Icon name={icon} className="h-5 w-5" /></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status === "Live" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>{status}</span></div><p className="mb-1 text-xs text-slate-600">{String(index + 1).padStart(2, "0")}</p><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p></motion.button>)}</div></div>;
}
