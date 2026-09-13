"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { Zap, Cloud, Server, Plus, Globe, ArrowUpRight, Loader2, CheckCircle, Clock } from "lucide-react";

type Deployment = {
  id: string;
  name: string;
  provider: string;
  region: string;
  status: "active" | "deploying" | "failed" | "inactive";
  edgeLocations: number;
  requestsPerSec: number;
  lastDeployed: string;
};

type DeploymentLog = {
  id: string;
  deployment: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  timestamp: string;
};

const mockDeployments: Deployment[] = [
  { id: "d1", name: "Production CDN", provider: "Cloudflare", region: "Global", status: "active", edgeLocations: 280, requestsPerSec: 12400, lastDeployed: "2026-09-12T10:00:00Z" },
  { id: "d2", name: "US East Edge", provider: "AWS CloudFront", region: "us-east-1", status: "active", edgeLocations: 45, requestsPerSec: 3200, lastDeployed: "2026-09-11T14:00:00Z" },
  { id: "d3", name: "EU West Edge", provider: "Fastly", region: "eu-west-1", status: "deploying", edgeLocations: 12, requestsPerSec: 0, lastDeployed: "2026-09-12T14:30:00Z" },
];

const mockLogs: DeploymentLog[] = [
  { id: "l1", deployment: "EU West Edge", message: "Deployment started for Fastly edge nodes", level: "info", timestamp: "2026-09-12T14:30:00Z" },
  { id: "l2", deployment: "Production CDN", message: "Configuration propagated to 280 edge locations", level: "success", timestamp: "2026-09-12T10:05:00Z" },
  { id: "l3", deployment: "US East Edge", message: "Health check passed on all 45 nodes", level: "success", timestamp: "2026-09-11T14:10:00Z" },
  { id: "l4", deployment: "EU West Edge", message: "Warning: 2 of 12 nodes not yet responding", level: "warning", timestamp: "2026-09-12T14:35:00Z" },
  { id: "l5", deployment: "Production CDN", message: "SSL certificate renewed for all domains", level: "info", timestamp: "2026-09-12T09:00:00Z" },
];

const providers = [
  { id: "cloudflare", name: "Cloudflare", description: "Global CDN with 280+ edge locations" },
  { id: "aws", name: "AWS CloudFront", description: "Amazon's content delivery network" },
  { id: "fastly", name: "Fastly", description: "Real-time CDN with edge computing" },
  { id: "vercel", name: "Vercel Edge", description: "Edge functions with instant deploys" },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function EdgePage() {
  const [deployments] = useState<Deployment[]>(mockDeployments);
  const [logs] = useState<DeploymentLog[]>(mockLogs);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Edge Deployment</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BotShield Edge</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Edge Deployments</h1>
          <p className="mt-1 text-slate-400">Deploy BotShield protection to edge locations worldwide for minimal latency.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["Deployments", deployments.length, "blue"], ["Edge Locations", deployments.reduce((sum, d) => sum + d.edgeLocations, 0), "emerald"], ["Requests/sec", deployments.reduce((sum, d) => sum + d.requestsPerSec, 0).toLocaleString(), "violet"], ["Active", deployments.filter((d) => d.status === "active").length, "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* Active Deployments */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Deployments</h2>
              <p className="mt-1 text-sm text-slate-400">Manage your edge deployments and monitor their health.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
              <Plus className="h-4 w-4" /> New Deployment
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {deployments.map((dep) => (
              <div key={dep.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    {dep.status === "deploying" ? <Loader2 className="h-5 w-5 animate-spin text-blue-400" /> : <Cloud className="h-5 w-5 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{dep.name}</p>
                    <p className="text-xs text-slate-500">{dep.provider} &middot; {dep.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{dep.edgeLocations} edges</p>
                    <p className="text-xs text-slate-500">{dep.requestsPerSec.toLocaleString()} req/s</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${dep.status === "active" ? "bg-green-500/10 text-green-400" : dep.status === "deploying" ? "bg-blue-500/10 text-blue-400" : dep.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-slate-700 text-slate-400"}`}>{dep.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Provider Selection */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Edge Providers</h2>
          <p className="mt-1 text-sm text-slate-400">Choose a provider for your next deployment.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {providers.map((provider) => (
              <button key={provider.id} onClick={() => setSelectedProvider(selectedProvider === provider.id ? null : provider.id)} className={`group rounded-xl border p-4 text-left transition ${selectedProvider === provider.id ? "border-blue-500/50 bg-blue-500/5" : "border-slate-700 bg-slate-950 hover:border-blue-500/30"}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 transition group-hover:bg-blue-500/20">
                  <Globe className="h-5 w-5 text-blue-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-white">{provider.name}</p>
                <p className="mt-1 text-xs text-slate-500">{provider.description}</p>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Deployment Logs */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Deployment Logs</h2>
          <div className="mt-4 space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="mt-0.5">
                  {log.level === "success" ? <CheckCircle className="h-4 w-4 text-green-400" /> : log.level === "warning" ? <ArrowUpRight className="h-4 w-4 text-amber-400" /> : log.level === "error" ? <ArrowUpRight className="h-4 w-4 text-red-400" /> : <Clock className="h-4 w-4 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{log.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{log.deployment} &middot; {new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
