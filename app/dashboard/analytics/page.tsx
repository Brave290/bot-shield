"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { StatCard, Select } from "@/components/ui/form";
import { motion } from "framer-motion";
import { BarChart3, Shield, Globe, Activity, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type AnalyticsRow = { name: string; count: number };
type DailyRow = { label: string; requests: number; blocked: number };
type ThreatRow = { created_at: string; bot_type: string; score: number; country?: string };
type AnalyticsData = { totals: { requests: number; blocked: number; humans: number }; daily: DailyRow[]; botTypes: AnalyticsRow[]; countries: AnalyticsRow[]; threats: ThreatRow[] };

export default function Analytics() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const res = await fetch(`/api/analytics?range=${range}`, { headers: { Authorization: `Bearer ${sess.session?.access_token || ""}` } });
        const body = await res.json().catch(() => null);
        if (res.ok && body && typeof body === "object") {
          setData({
            ...body,
            totals: body.totals || { requests: 0, blocked: 0, humans: 0 },
            daily: Array.isArray(body.daily) ? body.daily : [],
            botTypes: Array.isArray(body.botTypes) ? body.botTypes : [],
            countries: Array.isArray(body.countries) ? body.countries : [],
            threats: Array.isArray(body.threats) ? body.threats : [],
          } as AnalyticsData);
        } else {
          setData({ totals: { requests: 0, blocked: 0, humans: 0 }, daily: [], botTypes: [], countries: [], threats: [] });
        }
      } catch { setData({ totals: { requests: 0, blocked: 0, humans: 0 }, daily: [], botTypes: [], countries: [], threats: [] }); }
      finally { setLoading(false); }
    })();
  }, [range]);

  if (loading || !data) return (
    <DashboardShell userType="user">
      <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
    </DashboardShell>
  );

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.requests));
  const maxBot = Math.max(1, ...data.botTypes.map((b) => b.count));
  const rate = data.totals.requests ? Math.round((data.totals.blocked / data.totals.requests) * 100) : 0;

  return (
    <DashboardShell userType="user">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Analytics</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Traffic Intelligence</h1>
            <p className="mt-1 text-sm text-slate-400">What BotShield is protecting you from, in real time.</p>
          </div>
          <Select value={range} onChange={setRange} options={[{ value: "24h", label: "Last 24 hours" }, { value: "7d", label: "Last 7 days" }, { value: "30d", label: "Last 30 days" }]} className="w-48" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Requests" value={data.totals.requests} color="bg-blue-500" trend={{ value: 12, positive: true }} />
          <StatCard label="Bots Blocked" value={data.totals.blocked} color="bg-red-500" />
          <StatCard label="Humans Passed" value={data.totals.humans} color="bg-emerald-500" />
          <StatCard label="Detection Rate" value={`${rate}%`} color="bg-amber-500" />
        </div>

        {/* Traffic Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold">Traffic over time</h2>
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600/70" />Human</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/70" />Blocked</span>
            </div>
          </div>
          {data.daily.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No traffic in this range yet. Run your test scripts and watch this fill up.</p>
            </div>
          ) : (
            <div className="flex items-end gap-1 h-48">
              {data.daily.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex-1 flex flex-col justify-end h-full group relative"
                  title={`${d.label}: ${d.requests} requests, ${d.blocked} blocked`}
                >
                  <div className="bg-red-500/70 rounded-t group-hover:bg-red-500 transition-colors" style={{ height: `${(d.blocked / maxDaily) * 100}%` }} />
                  <div className="bg-blue-600/70 rounded-b group-hover:bg-blue-600 transition-colors" style={{ height: `${((d.requests - d.blocked) / maxDaily) * 100}%` }} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bot Types */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-white font-semibold mb-4">Bot Classification</h2>
            <div className="space-y-3">
              {data.botTypes.length === 0 ? (
                <p className="text-slate-500 text-sm">Nothing classified yet.</p>
              ) : data.botTypes.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{b.name}</span><span className="text-slate-500">{b.count}</span></div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-red-500/80 transition-all" style={{ width: `${(b.count / maxBot) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-white font-semibold mb-4">Top Countries</h2>
            <div className="space-y-3">
              {data.countries.length === 0 ? (
                <p className="text-slate-500 text-sm">No geo data yet.</p>
              ) : data.countries.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300 uppercase">{c.name}</span>
                  </div>
                  <span className="text-sm text-slate-500">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Threats */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-white font-semibold mb-4">Recent Threats</h2>
          {data.threats.length === 0 ? (
            <p className="text-slate-500 text-sm">No blocked threats in this range.</p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {data.threats.map((t, i) => (
                <div key={i} className="py-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="text-slate-600 font-mono">{new Date(t.created_at).toLocaleString()}</span>
                  <span className="text-red-400 font-medium">{t.bot_type}</span>
                  <span className="text-slate-400">risk {t.score}</span>
                  <span className="text-slate-500 uppercase">{t.country || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
