"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Select, Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { Download, FileJson, FileText, FileSpreadsheet, Clock, CheckCircle2, Loader2, AlertCircle, XCircle } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type ExportJob = { id: string; type: string; format: string; status: string; file_url: string; row_count: number; project_id: string; date_from: string; date_to: string; created_at: string; completed_at: string };
type FormData = { type: string; format: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const exportTypes = [
  { value: "verification_logs", label: "Verification Logs", description: "All challenge/verify requests" },
  { value: "analytics", label: "Analytics", description: "Request volume and detection rates" },
  { value: "incidents", label: "Incidents", description: "Security incident records" },
  { value: "threat_lists", label: "Threat Lists", description: "IP, country, and ASN lists" },
  { value: "fingerprints", label: "Fingerprints", description: "Browser fingerprint records" },
];
const formatOptions = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
];
const statusConfig: Record<string, { icon: any; color: "success" | "info" | "warning" | "danger" }> = {
  completed: { icon: CheckCircle2, color: "success" },
  processing: { icon: Loader2, color: "info" },
  pending: { icon: Clock, color: "warning" },
  failed: { icon: AlertCircle, color: "danger" },
};

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormData>({ type: "verification_logs", format: "csv" });

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/exports", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
      if (res.ok) setJobs(await res.json());
      else setError("Failed to load exports");
    } catch { setError("Failed to load data"); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, format: form.format }),
      });
      const result = await res.json();
      if (!res.ok) return toast("error", result.error || "Failed to create export");
      toast("success", "Export job started");
      await load();
    } finally { setCreating(false); }
  };

  const download = (job: ExportJob) => {
    if (!job.file_url) return toast("error", "File not ready yet");
    window.open(job.file_url, "_blank");
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
            <p className="text-lg font-semibold text-white">Failed to load exports</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); void load(); }} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user" userPlan="Pro">
      <PlanGate feature="exports" currentPlan="Pro">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Data</p>
            <div className="mt-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">Data Exports</h1>
              <p className="mt-1 text-slate-400">Export your BotShield data in multiple formats.</p>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total exports" value={jobs.length} color="bg-blue-500" />
            <StatCard label="Completed" value={jobs.filter((j) => j.status === "completed").length} color="bg-emerald-500" />
            <StatCard label="Pending" value={jobs.filter((j) => j.status === "pending" || j.status === "processing").length} color="bg-amber-500" />
          </div>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">New export</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Data type</label>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {exportTypes.map((t) => (
                    <button key={t.value} onClick={() => setForm({ ...form, type: t.value })} className={`rounded-xl border p-3 text-left transition ${form.type === t.value ? "border-blue-500/40 bg-blue-500/10" : "border-slate-700 bg-slate-950 hover:border-slate-600"}`}>
                      <p className="text-sm font-medium text-white">{t.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Format</label>
                <div className="flex gap-3">
                  {formatOptions.map((f) => (
                    <button key={f.value} onClick={() => setForm({ ...form, format: f.value })} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${form.format === f.value ? "border-blue-500/40 bg-blue-500/10 text-white" : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600"}`}>
                      {f.value === "csv" ? <FileSpreadsheet className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={create} disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
                <Download className="h-4 w-4" /> {creating ? "Starting..." : "Start export"}
              </button>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Job history</h2>
            {jobs.length === 0 ? (
              <EmptyState icon={<Download className="h-8 w-8 text-slate-600" />} title="No exports yet" description="Create your first data export to download your BotShield data." />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Format</th>
                      <th className="pb-3 pr-4">Rows</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Created</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {jobs.map((job, i) => {
                      const st = statusConfig[job.status] || statusConfig.pending;
                      const StIcon = st.icon;
                      const typeLabel = exportTypes.find((t) => t.value === job.type)?.label || job.type;
                      return (
                        <motion.tr key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="text-slate-300">
                          <td className="py-3 pr-4 text-sm text-white">{typeLabel}</td>
                          <td className="py-3 pr-4"><Badge variant="default">{job.format.toUpperCase()}</Badge></td>
                          <td className="py-3 pr-4 text-xs text-slate-400">{job.row_count?.toLocaleString() || "—"}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={st.color}>
                              <StIcon className={`h-3 w-3 ${job.status === "processing" ? "animate-spin" : ""}`} />
                              {job.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-xs text-slate-500">{new Date(job.created_at).toLocaleString()}</td>
                          <td className="py-3">
                            {job.status === "completed" && (
                              <button onClick={() => download(job)} className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 px-2.5 py-1.5 text-[10px] font-medium text-blue-400 transition hover:bg-blue-500/10">
                                <Download className="h-3 w-3" /> Download
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.section>
        </div>
      </PlanGate>
    </DashboardShell>
  );
}
