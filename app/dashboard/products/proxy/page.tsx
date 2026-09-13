"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { Globe, ArrowRightLeft, Activity, Plus, Server, Clock, CheckCircle, XCircle } from "lucide-react";

type ProxyConfig = {
  id: string;
  name: string;
  upstream: string;
  port: number;
  protocol: "http" | "https" | "tcp";
  status: "active" | "inactive" | "error";
  requests: number;
  latency: number;
};

type ProxyLog = {
  id: string;
  config: string;
  method: string;
  path: string;
  status: number;
  latency: number;
  timestamp: string;
};

const mockConfigs: ProxyConfig[] = [
  { id: "1", name: "API Gateway", upstream: "api.internal.example.com", port: 443, protocol: "https", status: "active", requests: 45230, latency: 12 },
  { id: "2", name: "Static Assets", upstream: "cdn.example.com", port: 443, protocol: "https", status: "active", requests: 128900, latency: 5 },
  { id: "3", name: "Legacy API", upstream: "legacy.internal.example.com", port: 8080, protocol: "http", status: "inactive", requests: 1230, latency: 45 },
];

const mockLogs: ProxyLog[] = [
  { id: "l1", config: "API Gateway", method: "GET", path: "/api/v1/users", status: 200, latency: 15, timestamp: "2026-09-12T14:32:00Z" },
  { id: "l2", config: "API Gateway", method: "POST", path: "/api/v1/auth", status: 201, latency: 22, timestamp: "2026-09-12T14:31:00Z" },
  { id: "l3", config: "Static Assets", method: "GET", path: "/assets/main.js", status: 200, latency: 3, timestamp: "2026-09-12T14:30:00Z" },
  { id: "l4", config: "API Gateway", method: "GET", path: "/api/v1/search", status: 500, latency: 120, timestamp: "2026-09-12T14:29:00Z" },
  { id: "l5", config: "Legacy API", method: "GET", path: "/old/endpoint", status: 503, latency: 500, timestamp: "2026-09-12T14:28:00Z" },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function ProxyPage() {
  const [configs] = useState<ProxyConfig[]>(mockConfigs);
  const [logs] = useState<ProxyLog[]>(mockLogs);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUpstream, setNewUpstream] = useState("");
  const [newPort, setNewPort] = useState("443");
  const [newProtocol, setNewProtocol] = useState<"http" | "https" | "tcp">("https");

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Reverse Proxy</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BotShield Proxy</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Proxy Configurations</h1>
          <p className="mt-1 text-slate-400">Route and protect your traffic through BotShield's reverse proxy layer.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["Configurations", configs.length, "blue"], ["Active", configs.filter((c) => c.status === "active").length, "emerald"], ["Total Requests", configs.reduce((sum, c) => sum + c.requests, 0).toLocaleString(), "violet"], ["Avg Latency", `${Math.round(configs.reduce((sum, c) => sum + c.latency, 0) / configs.length)}ms`, "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* Proxy Configs */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Configurations</h2>
              <p className="mt-1 text-sm text-slate-400">Manage your proxy endpoints and upstream servers.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
              <Plus className="h-4 w-4" /> Add Config
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {configs.map((config) => (
              <div key={config.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{config.name}</p>
                    <p className="font-mono text-xs text-slate-500">{config.protocol}://{config.upstream}:{config.port}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{config.requests.toLocaleString()} reqs</p>
                    <p className="text-xs text-slate-500">{config.latency}ms avg</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.status === "active" ? "bg-green-500/10 text-green-400" : config.status === "error" ? "bg-red-500/10 text-red-400" : "bg-slate-700 text-slate-400"}`}>{config.status}</span>
                </div>
              </div>
            ))}
          </div>

          {showForm && (
            <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <h3 className="text-sm font-semibold text-white">New Proxy Configuration</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400">Name</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Proxy" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Upstream Host</label>
                  <input value={newUpstream} onChange={(e) => setNewUpstream(e.target.value)} placeholder="upstream.example.com" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Port</label>
                  <input value={newPort} onChange={(e) => setNewPort(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Protocol</label>
                  <select value={newProtocol} onChange={(e) => setNewProtocol(e.target.value as "http" | "https" | "tcp")} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
                    <option value="https">HTTPS</option>
                    <option value="http">HTTP</option>
                    <option value="tcp">TCP</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">Create</button>
                <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 transition hover:border-slate-600">Cancel</button>
              </div>
            </div>
          )}
        </motion.section>

        {/* Recent Logs */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Recent Logs</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-3 font-medium">Config</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Path</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Latency</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="py-3 text-white">{log.config}</td>
                    <td className="py-3"><span className={`rounded px-1.5 py-0.5 text-xs font-mono ${log.method === "GET" ? "bg-blue-500/10 text-blue-400" : log.method === "POST" ? "bg-green-500/10 text-green-400" : "bg-slate-700 text-slate-300"}`}>{log.method}</span></td>
                    <td className="py-3 font-mono text-xs text-slate-400 max-w-[200px] truncate">{log.path}</td>
                    <td className="py-3">{log.status >= 200 && log.status < 300 ? <CheckCircle className="h-4 w-4 text-green-400" /> : log.status >= 500 ? <XCircle className="h-4 w-4 text-red-400" /> : <span className="text-sm text-amber-400">{log.status}</span>}</td>
                    <td className="py-3 text-slate-400">{log.latency}ms</td>
                    <td className="py-3 text-slate-500 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
