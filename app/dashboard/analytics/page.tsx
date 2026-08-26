"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "@/components/Navigation";
import { BrandLoader } from "@/components/loader";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Analytics() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch(`/api/analytics?range=${range}`, { headers: { Authorization: `Bearer ${sess.session?.access_token || ""}` } });
      if (res.ok) setData(await res.json());
    })();
  }, [range]);

  if (!data) return (<><Navigation /><BrandLoader /></>);

  const maxDaily = Math.max(1, ...data.daily.map((d: any) => d.requests));
  const maxBot = Math.max(1, ...data.botTypes.map((b: any) => b.count));
  const rate = data.totals.requests ? Math.round((data.totals.blocked / data.totals.requests) * 100) : 0;

  return (<>
    <Navigation />
    <main className="pt-28 pb-24 max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
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
          {data.daily.map((d: any, i: number) => (
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
            {data.botTypes.map((b: any) => (
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
            {data.countries.map((c: any) => (
              <div key={c.name} className="flex justify-between text-sm"><span className="text-slate-300 uppercase">{c.name}</span><span className="text-slate-500">{c.count}</span></div>
            ))}
            {data.countries.length === 0 && <p className="text-slate-500 text-sm font-light">No geo data yet.</p>}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
        <h2 className="text-white font-semibold mb-4">Recent threats</h2>
        <div className="divide-y divide-slate-800/60">
          {data.threats.map((t: any, i: number) => (
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
  </>);
}
