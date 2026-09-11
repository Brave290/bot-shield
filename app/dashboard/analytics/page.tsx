"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "@/components/Navigation";
import { BrandLoader } from "@/components/loader";
import Link from "next/link";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type AnalyticsRow = { name: string; count: number };
type DailyRow = { label: string; requests: number; blocked: number };
type ThreatRow = { created_at: string; bot_type: string; score: number; country?: string };
type AnalyticsData = { totals: { requests: number; blocked: number; humans: number }; daily: DailyRow[]; botTypes: AnalyticsRow[]; countries: AnalyticsRow[]; threats: ThreatRow[] };

export default function Analytics() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const admin = await fetch("/api/admin/data?type=me", { headers: { Authorization: `Bearer ${sess.session?.access_token || ""}` } });
      setIsAdmin(admin.ok);
      const res = await fetch(`/api/analytics?range=${range}`, { headers: { Authorization: `Bearer ${sess.session?.access_token || ""}` } });
      const body = await res.json().catch(() => null);
      if (res.ok && body && typeof body === "object") {
        setData({
          ...body,
          totals: body.totals || { requests: 0, blocked: 0, humans: 0 },
          daily: Array.isArray(body.daily) ? body.daily : [], botTypes: Array.isArray(body.botTypes) ? body.botTypes : [], countries: Array.isArray(body.countries) ? body.countries : [], threats: Array.isArray(body.threats) ? body.threats : [],
        } as AnalyticsData);
      } else {
        setData({ totals: { requests: 0, blocked: 0, humans: 0 }, daily: [], botTypes: [], countries: [], threats: [] });
      }
    })();
  }, [range]);

  if (!data) return (<><Navigation /><BrandLoader /></>);

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.requests));
  const maxBot = Math.max(1, ...data.botTypes.map((b) => b.count));
  const rate = data.totals.requests ? Math.round((data.totals.blocked / data.totals.requests) * 100) : 0;

  return (<>
    <Navigation />
    <main className="pt-28 pb-32 max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1 font-light">What BotShield is protecting you from, live.</p>
        </div>
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-4 py-2 rounded-lg text-sm ${range === r ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:text-white"}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[["Requests", data.totals.requests], ["Bots blocked", data.totals.blocked], ["Humans", data.totals.humans], ["Detection rate", rate + "%"]].map(([l, v]) => (
          <div key={String(l)} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
            <p className="font-serif text-3xl font-bold text-white">{String(v)}</p>
            <p className="text-xs text-slate-500 mt-1">{l}</p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
        <h2 className="text-white font-semibold mb-6">Traffic over time</h2>
        <div className="flex items-end gap-1 h-40">
          {data.daily.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full" title={`${d.label}: ${d.requests} requests, ${d.blocked} blocked`}>
              <div className="bg-red-500/70 rounded-t" style={{ height: `${(d.blocked / maxDaily) * 100}%` }} />
              <div className="bg-blue-600/70 rounded-b" style={{ height: `${((d.requests - d.blocked) / maxDaily) * 100}%` }} />
            </div>
          ))}
        </div>
        {data.daily.length === 0 && <p className="text-slate-500 text-sm font-light">No traffic in this range yet. Run your test scripts and watch this fill up.</p>}
        <div className="flex gap-4 mt-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-600/70" />Human</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/70" />Blocked</span></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
          <h2 className="text-white font-semibold mb-4">Bot types</h2>
          <div className="space-y-3">
            {data.botTypes.map((b) => (
              <div key={b.name}>
                <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{b.name}</span><span className="text-slate-500">{b.count}</span></div>
                <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-red-500/80" style={{ width: `${(b.count / maxBot) * 100}%` }} /></div>
              </div>
            ))}
            {data.botTypes.length === 0 && <p className="text-slate-500 text-sm font-light">Nothing classified yet.</p>}
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
          <h2 className="text-white font-semibold mb-4">Top countries</h2>
          <div className="space-y-3">
            {data.countries.map((c) => (
              <div key={c.name} className="flex justify-between text-sm"><span className="text-slate-300 uppercase">{c.name}</span><span className="text-slate-500">{c.count}</span></div>
            ))}
            {data.countries.length === 0 && <p className="text-slate-500 text-sm font-light">No geo data yet.</p>}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
        <h2 className="text-white font-semibold mb-4">Recent threats</h2>
        <div className="divide-y divide-slate-800/60">
          {data.threats.map((t, i) => (
            <div key={i} className="py-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="text-slate-600 font-mono">{new Date(t.created_at).toLocaleString()}</span>
              <span className="text-red-400 font-medium">{t.bot_type}</span>
              <span className="text-slate-400">risk {t.score}</span>
              <span className="text-slate-500 uppercase">{t.country || "—"}</span>
            </div>
          ))}
          {data.threats.length === 0 && <p className="text-slate-500 text-sm font-light">No blocked threats in this range.</p>}
        </div>
      </div>
    </main>
    {isAdmin && <nav aria-label="Admin navigation" className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#07101e]/95 px-2 py-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-xl items-stretch justify-between gap-1 overflow-x-auto"><Link href="/admin" className="min-w-[72px] rounded-xl px-2 py-2 text-center text-[10px] text-slate-400 hover:bg-slate-900 hover:text-white">Overview</Link><Link href="/admin?tab=users" className="min-w-[72px] rounded-xl px-2 py-2 text-center text-[10px] text-slate-400 hover:bg-slate-900 hover:text-white">Users</Link><Link href="/dashboard/analytics" className="min-w-[72px] rounded-xl bg-blue-600/15 px-2 py-2 text-center text-[10px] text-blue-300">Analytics</Link><Link href="/admin?tab=audit" className="min-w-[72px] rounded-xl px-2 py-2 text-center text-[10px] text-slate-400 hover:bg-slate-900 hover:text-white">Audit</Link><Link href="/admin/settings" className="min-w-[72px] rounded-xl px-2 py-2 text-center text-[10px] text-slate-400 hover:bg-slate-900 hover:text-white">Settings</Link></div></nav>}
  </>);
}
