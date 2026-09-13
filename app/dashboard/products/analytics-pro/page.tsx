"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { BarChart3, PieChart, TrendingUp, Plus, Filter, Download, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

type DashboardWidget = {
  id: string;
  title: string;
  type: "line" | "bar" | "pie" | "metric";
  value: string;
  change: number;
  data?: number[];
};

type SavedFilter = {
  id: string;
  name: string;
  description: string;
  lastRun: string;
  results: number;
};

const mockWidgets: DashboardWidget[] = [
  { id: "w1", title: "Total Requests", type: "metric", value: "1.2M", change: 12.5, data: [40, 55, 45, 60, 75, 65, 80, 90, 85, 95, 100, 110] },
  { id: "w2", title: "Bot Detection Rate", type: "metric", value: "94.2%", change: 2.1, data: [88, 89, 91, 90, 92, 93, 91, 94, 93, 95, 94, 94] },
  { id: "w3", title: "Blocked Requests", type: "metric", value: "45.2K", change: -5.3, data: [30, 35, 40, 38, 42, 45, 43, 40, 38, 42, 45, 45] },
  { id: "w4", title: "Avg Response Time", type: "metric", value: "42ms", change: -8.2, data: [55, 52, 48, 45, 43, 44, 42, 40, 41, 42, 43, 42] },
];

const mockFilters: SavedFilter[] = [
  { id: "f1", name: "High-risk bots", description: "Requests with score > 80 from known bot IPs", lastRun: "2026-09-12T14:00:00Z", results: 1245 },
  { id: "f2", name: "Failed logins", description: "Authentication failures in the last 24 hours", lastRun: "2026-09-12T12:00:00Z", results: 89 },
  { id: "f3", name: "Geographic anomalies", description: "Requests from unusual locations for each user", lastRun: "2026-09-11T18:00:00Z", results: 234 },
];

const widgetGallery = [
  { id: "g1", name: "Request Volume", icon: BarChart3, description: "Track total requests over time" },
  { id: "g2", name: "Bot Distribution", icon: PieChart, description: "See the breakdown of bot vs human traffic" },
  { id: "g3", name: "Trend Analysis", icon: TrendingUp, description: "Identify patterns and anomalies" },
  { id: "g4", name: "Geographic Map", icon: BarChart3, description: "Visualize traffic by location" },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function AnalyticsProPage() {
  const [widgets] = useState<DashboardWidget[]>(mockWidgets);
  const [filters] = useState<SavedFilter[]>(mockFilters);

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Advanced Analytics</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Analytics Pro</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Analytics Pro</h1>
          <p className="mt-1 text-slate-400">Build custom dashboards, save filters, and visualize your security data.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {widgets.map((widget) => (
            <div key={widget.id} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className="flex items-center justify-between">
                <div className={`mb-4 h-1 w-10 rounded-full ${widget.change >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className={`flex items-center gap-1 text-xs ${widget.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {widget.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(widget.change)}%
                </span>
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500">{widget.title}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{widget.value}</p>
              {/* Mini sparkline */}
              {widget.data && (
                <div className="mt-3 flex items-end gap-0.5 h-8">
                  {widget.data.map((v, i) => (
                    <div key={i} className="flex-1 rounded-t bg-blue-500/20 transition-all" style={{ height: `${(v / Math.max(...widget.data!)) * 100}%` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Dashboard Builder */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Dashboard Builder</h2>
              <p className="mt-1 text-sm text-slate-400">Drag and drop widgets to create your custom dashboard.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
              <Plus className="h-4 w-4" /> New Dashboard
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {widgetGallery.map((item) => (
              <button key={item.id} className="group flex items-start gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-left transition hover:border-blue-500/50 hover:bg-slate-900">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 transition group-hover:bg-blue-500/20">
                  <item.icon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Saved Filters */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Saved Filters</h2>
              <p className="mt-1 text-sm text-slate-400">Quick access to your frequently used search queries.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-blue-500/50 hover:text-white">
              <Filter className="h-4 w-4" /> Create Filter
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {filters.map((filter) => (
              <div key={filter.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Filter className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{filter.name}</p>
                    <p className="text-xs text-slate-500">{filter.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{filter.results.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">results</p>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(filter.lastRun).toLocaleDateString()}</span>
                  <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white transition hover:bg-blue-500">Run</button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Export Options */}
        <motion.section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Export Data</h2>
              <p className="mt-1 text-sm text-slate-400">Download your analytics data for external analysis.</p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-blue-500/50 hover:text-white">
                <Download className="h-4 w-4" /> CSV
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-blue-500/50 hover:text-white">
                <Download className="h-4 w-4" /> PDF
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
