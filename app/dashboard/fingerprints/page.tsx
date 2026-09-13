"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { Select, Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { Search, Fingerprint, Globe, Activity, Clock, Hash, XCircle, Bot } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type FingerprintRecord = { id: string; fingerprint: string; score: number; bot_type: string; country: string; ip_hash: string; user_agent: string; project_id: string; created_at: string; metadata: Record<string, unknown> };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const botTypeOptions = [
  { value: "", label: "All types" },
  { value: "human", label: "Human" },
  { value: "bot", label: "Bot" },
  { value: "suspicious", label: "Suspicious" },
  { value: "unknown", label: "Unknown" },
];

export default function FingerprintsPage() {
  const [records, setRecords] = useState<FingerprintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchHash, setSearchHash] = useState("");
  const [searching, setSearching] = useState(false);
  const [botFilter, setBotFilter] = useState("");

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/fingerprints", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
      if (res.ok) setRecords(await res.json());
      else setError("Failed to load fingerprints");
    } catch { setError("Failed to load data"); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const search = async () => {
    setSearching(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const params = new URLSearchParams();
      if (searchHash.trim()) params.set("search", searchHash.trim());
      if (botFilter) params.set("bot_type", botFilter);
      const res = await fetch(`/api/fingerprints?${params.toString()}`, { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
      if (res.ok) setRecords(await res.json());
    } finally { setSearching(false); }
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "danger";
    if (score >= 40) return "warning";
    return "success";
  };

  const scoreLabel = (score: number) => {
    if (score >= 70) return "High risk";
    if (score >= 40) return "Medium";
    return "Low risk";
  };

  const botTypeBadge = (type: string) => {
    if (type === "bot") return "danger" as const;
    if (type === "suspicious") return "warning" as const;
    if (type === "human") return "success" as const;
    return "default" as const;
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

  if (error) {
    return (
      <DashboardShell userType="user">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-lg font-semibold text-white">Failed to load fingerprints</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); void load(); }} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user" userPlan="Pro">
      <PlanGate feature="fingerprints" currentPlan="Pro">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Forensics</p>
            <div className="mt-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">Fingerprints</h1>
              <p className="mt-1 text-slate-400">Search and inspect browser fingerprint history.</p>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total records" value={records.length} color="bg-blue-500" />
            <StatCard label="High risk" value={records.filter((r) => r.score >= 70).length} color="bg-red-500" />
            <StatCard label="Bots detected" value={records.filter((r) => r.bot_type === "bot").length} color="bg-amber-500" />
            <StatCard label="Unique countries" value={new Set(records.map((r) => r.country).filter(Boolean)).size} color="bg-emerald-500" />
          </div>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input value={searchHash} onChange={(e) => setSearchHash(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search by fingerprint hash..." className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="w-full sm:w-48">
                <Select value={botFilter} onChange={(v) => { setBotFilter(v); }} options={botTypeOptions} placeholder="Bot type" />
              </div>
              <button onClick={search} disabled={searching} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Results</h2>
              <Badge variant="info">{records.length} records</Badge>
            </div>
            {records.length === 0 ? (
              <EmptyState icon={<Fingerprint className="h-8 w-8 text-slate-600" />} title="No fingerprints found" description={searchHash ? "No fingerprints match your search criteria." : "Fingerprint records will appear here as requests are processed."} />
            ) : (
              <div className="mt-4 space-y-3">
                {records.map((rec, i) => (
                  <motion.div key={rec.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="rounded-xl bg-slate-950 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-slate-500" />
                          <p className="font-mono text-xs text-white">{rec.fingerprint}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {rec.country && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{rec.country}</span>}
                          <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" />Score: <span className="font-mono font-bold">{rec.score}</span></span>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(rec.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={botTypeBadge(rec.bot_type)}>
                          <Bot className="h-3 w-3" />
                          {rec.bot_type}
                        </Badge>
                        <Badge variant={scoreColor(rec.score)}>{scoreLabel(rec.score)}</Badge>
                      </div>
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
      </PlanGate>
    </DashboardShell>
  );
}
