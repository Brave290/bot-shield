"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { Layers, ShieldAlert, Activity, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

type WafRule = {
  id: string;
  name: string;
  description: string;
  action: "block" | "challenge" | "log";
  enabled: boolean;
  matches: number;
  lastTriggered: string;
};

type WafEvent = {
  id: string;
  rule: string;
  sourceIp: string;
  path: string;
  action: string;
  timestamp: string;
};

const mockRules: WafRule[] = [
  { id: "1", name: "Block SQL Injection", description: "Detects and blocks SQL injection attempts in query parameters.", action: "block", enabled: true, matches: 1247, lastTriggered: "2026-09-12T14:30:00Z" },
  { id: "2", name: "Rate Limit Login", description: "Challenges IPs making more than 10 login attempts per minute.", action: "challenge", enabled: true, matches: 834, lastTriggered: "2026-09-12T13:45:00Z" },
  { id: "3", name: "Block Bad Bots", description: "Blocks known malicious user agents and scrapers.", action: "block", enabled: false, matches: 2156, lastTriggered: "2026-09-11T09:00:00Z" },
  { id: "4", name: "Geo Restriction", description: "Logs requests from restricted regions.", action: "log", enabled: true, matches: 543, lastTriggered: "2026-09-12T11:00:00Z" },
];

const mockEvents: WafEvent[] = [
  { id: "e1", rule: "Block SQL Injection", sourceIp: "192.168.1.xxx", path: "/api/search?q=' OR 1=1--", action: "blocked", timestamp: "2026-09-12T14:30:00Z" },
  { id: "e2", rule: "Rate Limit Login", sourceIp: "10.0.0.xxx", path: "/api/auth/login", action: "challenged", timestamp: "2026-09-12T13:45:00Z" },
  { id: "e3", rule: "Block Bad Bots", sourceIp: "172.16.0.xxx", path: "/", action: "blocked", timestamp: "2026-09-12T12:20:00Z" },
  { id: "e4", rule: "Geo Restriction", sourceIp: "203.0.113.xxx", path: "/dashboard", action: "logged", timestamp: "2026-09-12T11:10:00Z" },
  { id: "e5", rule: "Block SQL Injection", sourceIp: "198.51.100.xxx", path: "/api/users?id=1; DROP TABLE--", action: "blocked", timestamp: "2026-09-12T10:55:00Z" },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function WafPage() {
  const [rules, setRules] = useState<WafRule[]>(mockRules);
  const [events] = useState<WafEvent[]>(mockEvents);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRuleAction, setNewRuleAction] = useState<"block" | "challenge" | "log">("block");

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const addRule = () => {
    if (!newRuleName.trim()) return;
    const rule: WafRule = {
      id: String(Date.now()),
      name: newRuleName,
      description: newRuleDesc,
      action: newRuleAction,
      enabled: true,
      matches: 0,
      lastTriggered: "Never",
    };
    setRules([rule, ...rules]);
    setNewRuleName("");
    setNewRuleDesc("");
  };

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Web Application Firewall</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BotShield WAF</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">WAF Rules</h1>
          <p className="mt-1 text-slate-400">Configure firewall rules to protect your applications from common attacks.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["Total Rules", rules.length, "blue"], ["Active Rules", rules.filter((r) => r.enabled).length, "emerald"], ["Total Matches", rules.reduce((sum, r) => sum + r.matches, 0), "violet"], ["Events Today", 24, "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* Rules List */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Firewall Rules</h2>
              <p className="mt-1 text-sm text-slate-400">Toggle rules on/off and manage your protection policies.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <ShieldAlert className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{rule.name}</p>
                    <p className="text-xs text-slate-500 max-w-md truncate">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rule.action === "block" ? "bg-red-500/10 text-red-400" : rule.action === "challenge" ? "bg-amber-500/10 text-amber-400" : "bg-slate-700 text-slate-300"}`}>{rule.action}</span>
                  <span className="text-xs text-slate-500">{rule.matches.toLocaleString()} matches</span>
                  <button onClick={() => toggleRule(rule.id)} className="text-slate-400 transition hover:text-white">
                    {rule.enabled ? <ToggleRight className="h-6 w-6 text-green-400" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Create Rule Form */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Create Rule</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Rule Name</label>
              <input value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} placeholder="Block bad user agents" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Action</label>
              <select value={newRuleAction} onChange={(e) => setNewRuleAction(e.target.value as "block" | "challenge" | "log")} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
                <option value="block">Block</option>
                <option value="challenge">Challenge</option>
                <option value="log">Log</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400">Description</label>
              <textarea value={newRuleDesc} onChange={(e) => setNewRuleDesc(e.target.value)} placeholder="Describe what this rule does..." rows={3} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <button onClick={addRule} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
            <Plus className="h-4 w-4" /> Create Rule
          </button>
        </motion.section>

        {/* Recent Events */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Recent Events</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-3 font-medium">Rule</th>
                  <th className="pb-3 font-medium">Source IP</th>
                  <th className="pb-3 font-medium">Path</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-900/50">
                    <td className="py-3 text-white">{event.rule}</td>
                    <td className="py-3 text-slate-400 font-mono text-xs">{event.sourceIp}</td>
                    <td className="py-3 text-slate-400 max-w-[200px] truncate">{event.path}</td>
                    <td className="py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${event.action === "blocked" ? "bg-red-500/10 text-red-400" : event.action === "challenged" ? "bg-amber-500/10 text-amber-400" : "bg-slate-700 text-slate-300"}`}>{event.action}</span></td>
                    <td className="py-3 text-slate-500 text-xs">{new Date(event.timestamp).toLocaleString()}</td>
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
