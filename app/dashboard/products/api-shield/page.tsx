"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { Code2, Shield, Lock, Plus, Copy, Eye, EyeOff, Trash2, Key } from "lucide-react";

type ApiConfig = {
  id: string;
  name: string;
  baseUrl: string;
  authMethod: "api-key" | "oauth2" | "jwt";
  rateLimit: number;
  status: "active" | "inactive";
  requestsToday: number;
};

type RequestLog = {
  id: string;
  api: string;
  method: string;
  path: string;
  status: number;
  responseTime: number;
  timestamp: string;
};

const mockApis: ApiConfig[] = [
  { id: "1", name: "User API", baseUrl: "/api/v1/users", authMethod: "api-key", rateLimit: 1000, status: "active", requestsToday: 12450 },
  { id: "2", name: "Payment API", baseUrl: "/api/v1/payments", authMethod: "oauth2", rateLimit: 500, status: "active", requestsToday: 3200 },
  { id: "3", name: "Public Data", baseUrl: "/api/v1/public", authMethod: "jwt", rateLimit: 5000, status: "active", requestsToday: 45000 },
  { id: "4", name: "Legacy API", baseUrl: "/api/v0/legacy", authMethod: "api-key", rateLimit: 100, status: "inactive", requestsToday: 0 },
];

const mockLogs: RequestLog[] = [
  { id: "r1", api: "User API", method: "GET", path: "/api/v1/users/123", status: 200, responseTime: 45, timestamp: "2026-09-12T14:32:00Z" },
  { id: "r2", api: "Payment API", method: "POST", path: "/api/v1/payments/create", status: 201, responseTime: 120, timestamp: "2026-09-12T14:31:00Z" },
  { id: "r3", api: "Public Data", method: "GET", path: "/api/v1/public/products", status: 200, responseTime: 15, timestamp: "2026-09-12T14:30:00Z" },
  { id: "r4", api: "User API", method: "DELETE", path: "/api/v1/users/456", status: 403, responseTime: 20, timestamp: "2026-09-12T14:29:00Z" },
  { id: "r5", api: "Payment API", method: "POST", path: "/api/v1/payments/refund", status: 500, responseTime: 500, timestamp: "2026-09-12T14:28:00Z" },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function ApiShieldPage() {
  const [apis] = useState<ApiConfig[]>(mockApis);
  const [logs] = useState<RequestLog[]>(mockLogs);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKey = (id: string) => setShowKeys({ ...showKeys, [id]: !showKeys[id] });

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">API Protection</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BotShield API Shield</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">API Shield</h1>
          <p className="mt-1 text-slate-400">Protect your APIs with authentication, rate limiting, and request validation.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["APIs Protected", apis.length, "blue"], ["Active", apis.filter((a) => a.status === "active").length, "emerald"], ["Requests Today", apis.reduce((sum, a) => sum + a.requestsToday, 0).toLocaleString(), "violet"], ["Avg Response", "42ms", "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* API Configs */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Protected APIs</h2>
              <p className="mt-1 text-sm text-slate-400">Manage API endpoints and their security settings.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
              <Plus className="h-4 w-4" /> Add API
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {apis.map((api) => (
              <div key={api.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Code2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{api.name}</p>
                    <p className="font-mono text-xs text-slate-500">{api.baseUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-800 text-slate-300">
                    {api.authMethod === "api-key" ? <Key className="h-3 w-3" /> : api.authMethod === "oauth2" ? <Lock className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    {api.authMethod}
                  </span>
                  <span className="text-xs text-slate-500">{api.rateLimit}/min</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${api.status === "active" ? "bg-green-500/10 text-green-400" : "bg-slate-700 text-slate-400"}`}>{api.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Request Logs */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Request Logs</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-3 font-medium">API</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Path</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Response</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="py-3 text-white">{log.api}</td>
                    <td className="py-3"><span className={`rounded px-1.5 py-0.5 text-xs font-mono ${log.method === "GET" ? "bg-blue-500/10 text-blue-400" : log.method === "POST" ? "bg-green-500/10 text-green-400" : log.method === "DELETE" ? "bg-red-500/10 text-red-400" : "bg-slate-700 text-slate-300"}`}>{log.method}</span></td>
                    <td className="py-3 font-mono text-xs text-slate-400 max-w-[200px] truncate">{log.path}</td>
                    <td className="py-3"><span className={`text-sm font-medium ${log.status >= 200 && log.status < 300 ? "text-green-400" : log.status >= 400 && log.status < 500 ? "text-amber-400" : "text-red-400"}`}>{log.status}</span></td>
                    <td className="py-3 text-slate-400">{log.responseTime}ms</td>
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
