"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { Search, Fingerprint, Globe, Activity, Clock, Hash } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type FingerprintRecord = { id: string; hash: string; score: number; country: string; ip_hash: string; user_agent: string; created_at: string; metadata: Record<string, unknown> };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function FingerprintsPage() {
  const [records, setRecords] = useState<FingerprintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchHash, setSearchHash] = useState("");
  const [searching, setSearching] = useState(false);

  const load = async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/fingerprints", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
    if (res.ok) {
      const body = await res.json();
      setRecords(body.records || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const search = async () => {
    if (!searchHash.trim()) { await load(); return; }
    setSearching(true);
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch(`/api/fingerprints?hash=${encodeURIComponent(searchHash.trim())}`, { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
    if (res.ok) {
      const body = await res.json();
      setRecords(body.records || []);
    }
    setSearching(false);
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-red-400 bg-red-500/10";
    if (score >= 40) return "text-amber-400 bg-amber-500/10";
    return "text-emerald-400 bg-emerald-500/10";
  };

  if (loading) {
    return (
      <DashboardShell userType="user">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Forensics</p>
          <div className="mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Fingerprints</h1>
            <p className="mt-1 text-slate-400">Search and inspect browser fingerprint history.</p>
          </div>
        </motion.div>

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={searchHash} onChange={(e) => setSearchHash(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search by fingerprint hash..." className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>
            <button onClick={search} disabled={searching} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
              {searching ? "Searching..." : "Search"}
            </button>
          </div>
        </motion.section>

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Results</h2>
            <span className="text-xs text-slate-500">{records.length} records</span>
          </div>
          {records.length === 0 ? (
            <div className="mt-8 rounded-xl border-2 border-dashed border-slate-800 py-12 text-center">
              <Fingerprint className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">{searchHash ? "No fingerprints match that hash." : "No fingerprint records yet."}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {records.map((rec, i) => (
                <motion.div key={rec.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl bg-slate-950 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-slate-500" />
                        <p className="font-mono text-xs text-white">{rec.hash}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{rec.country || "Unknown"}</span>
                        <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" />Score: <span className={`font-mono font-bold ${scoreColor(rec.score).split(" ")[0]}`}>{rec.score}</span></span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(rec.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${scoreColor(rec.score)}`}>
                      {rec.score >= 70 ? "High risk" : rec.score >= 40 ? "Medium" : "Low risk"}
                    </span>
                  </div>
                  {rec.user_agent && (
                    <p className="mt-2 truncate text-[11px] text-slate-500 font-mono">{rec.user_agent}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </DashboardShell>
  );
}
