"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { PlanGate, PlanBadge, hasFeatureAccess } from "@/components/plan-gate";
import { Badge } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { Shield, Fingerprint, Bell, Webhook, Activity, Globe, Download, MessageSquare, AlertTriangle, FlaskConical, Lock, Zap, Users, BarChart3, ClipboardCheck, Cloud, ShoppingBag, ArrowRight } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const products = [
  { id: "security", name: "Security Center", description: "Staged policy rollout, key rotation, and webhook subscriptions.", icon: Shield, href: "/dashboard/security", featureId: "security", color: "blue", plan: "Hobby" },
  { id: "simulator", name: "Rules Simulator", description: "Preview how behavioral inputs map to a decision before going live.", icon: FlaskConical, href: "/dashboard/simulator", featureId: "simulator", color: "violet", plan: "Hobby" },
  { id: "webhooks", name: "Webhooks", description: "Real-time event notifications delivered to your endpoints.", icon: Webhook, href: "/dashboard/webhooks", featureId: "webhooks", color: "emerald", plan: "Pro" },
  { id: "alerts", name: "Alert Policies", description: "Define metric thresholds and get notified on breaches.", icon: Bell, href: "/dashboard/alerts", featureId: "alerts", color: "amber", plan: "Pro" },
  { id: "incidents", name: "Incidents", description: "Track, investigate, and resolve security incidents.", icon: AlertTriangle, href: "/dashboard/incidents", featureId: "incidents", color: "red", plan: "Pro" },
  { id: "threats", name: "Threat Lists", description: "Manage IP, country, and ASN blocklists and allowlists.", icon: Globe, href: "/dashboard/threats", featureId: "threats", color: "cyan", plan: "Pro" },
  { id: "fingerprints", name: "Fingerprints", description: "Search and inspect browser fingerprint history.", icon: Fingerprint, href: "/dashboard/fingerprints", featureId: "fingerprints", color: "pink", plan: "Pro" },
  { id: "feedback", name: "Model Feedback", description: "Submit corrections to improve detection accuracy.", icon: MessageSquare, href: "/dashboard/feedback", featureId: "feedback", color: "orange", plan: "Pro" },
  { id: "exports", name: "Data Exports", description: "Export request logs, detections, and fingerprints.", icon: Download, href: "/dashboard/exports", featureId: "exports", color: "teal", plan: "Pro" },
  { id: "analytics", name: "Analytics", description: "Request volume, detection rates, and latency metrics.", icon: Activity, href: "/dashboard/analytics", featureId: "analytics", color: "indigo", plan: "Hobby" },
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
  const [currentPlan] = useState("Hobby");

  return (
    <DashboardShell userType="user" userPlan={currentPlan}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Products</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">All Products</h1>
              <p className="mt-1 text-slate-400">Explore the full BotShield product suite.</p>
            </div>
            <div className="flex items-center gap-3">
              <PlanBadge plan={currentPlan} />
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => {
            const colors = colorMap[product.color] || colorMap.blue;
            const Icon = product.icon;
            const locked = !hasFeatureAccess(currentPlan, product.featureId);
            return (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !locked && router.push(product.href)}
                className={`group relative rounded-2xl border bg-slate-900/50 p-6 text-left transition ${locked ? "border-slate-800 opacity-75 cursor-not-allowed" : "border-slate-800 hover:border-blue-500/40 hover:bg-slate-900"}`}
              >
                {locked && (
                  <div className="absolute top-4 right-4">
                    <Lock className="h-4 w-4 text-amber-500" />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} transition group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={product.plan === "Hobby" ? "default" : product.plan === "Pro" ? "info" : "pro"}>
                      {product.plan}
                    </Badge>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{product.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{product.description}</p>
                {locked ? (
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-400">
                    <Lock className="h-3 w-3" /> Requires {product.plan} plan
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-400 opacity-0 transition group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {currentPlan !== "Enterprise" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-blue-500/5 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Zap className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Unlock all products with {currentPlan === "Hobby" ? "Pro" : "Enterprise"}</p>
                  <p className="text-xs text-slate-400">Get access to webhooks, alerts, incidents, threat lists, and more.</p>
                </div>
              </div>
              <a href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shrink-0">
                Upgrade to {currentPlan === "Hobby" ? "Pro" : "Enterprise"}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
