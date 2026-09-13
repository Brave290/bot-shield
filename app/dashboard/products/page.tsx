"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { useRouter } from "next/navigation";
import { Shield, Fingerprint, Bell, Webhook, Activity, Globe, Download, MessageSquare, AlertTriangle, FlaskConical } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const products = [
  { id: "security", name: "Security Center", description: "Staged policy rollout, key rotation, and webhook subscriptions.", icon: Shield, href: "/dashboard/security", status: "active", color: "blue" },
  { id: "simulator", name: "Rules Simulator", description: "Preview how behavioral inputs map to a decision before going live.", icon: FlaskConical, href: "/dashboard/simulator", status: "active", color: "violet" },
  { id: "webhooks", name: "Webhooks", description: "Real-time event notifications delivered to your endpoints.", icon: Webhook, href: "/dashboard/webhooks", status: "active", color: "emerald" },
  { id: "alerts", name: "Alert Policies", description: "Define metric thresholds and get notified on breaches.", icon: Bell, href: "/dashboard/alerts", status: "active", color: "amber" },
  { id: "incidents", name: "Incidents", description: "Track, investigate, and resolve security incidents.", icon: AlertTriangle, href: "/dashboard/incidents", status: "active", color: "red" },
  { id: "threats", name: "Threat Lists", description: "Manage IP, country, and ASN blocklists and allowlists.", icon: Globe, href: "/dashboard/threats", status: "active", color: "cyan" },
  { id: "fingerprints", name: "Fingerprints", description: "Search and inspect browser fingerprint history.", icon: Fingerprint, href: "/dashboard/fingerprints", status: "active", color: "pink" },
  { id: "feedback", name: "Model Feedback", description: "Submit corrections to improve detection accuracy.", icon: MessageSquare, href: "/dashboard/feedback", status: "active", color: "orange" },
  { id: "exports", name: "Data Exports", description: "Export request logs, detections, and fingerprints.", icon: Download, href: "/dashboard/exports", status: "active", color: "teal" },
  { id: "analytics", name: "Analytics", description: "Request volume, detection rates, and latency metrics.", icon: Activity, href: "/dashboard/analytics", status: "coming_soon", color: "indigo" },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
};

export default function ProductsPage() {
  const router = useRouter();

  return (
    <DashboardShell userType="user">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Products</p>
          <div className="mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">All Products</h1>
            <p className="mt-1 text-slate-400">Explore the full BotShield product suite.</p>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => {
            const colors = colorMap[product.color] || colorMap.blue;
            const Icon = product.icon;
            return (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(product.href)}
                className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-left transition hover:border-blue-500/40 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} transition group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${product.status === "active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-slate-700 bg-slate-800 text-slate-500"}`}>
                    {product.status === "active" ? "Active" : "Coming soon"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{product.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{product.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-400 opacity-0 transition group-hover:opacity-100">
                  Open →
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
