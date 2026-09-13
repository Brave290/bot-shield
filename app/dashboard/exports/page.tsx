"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Download, FileJson, FileText, FileSpreadsheet, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type ExportJob = { id: string; export_type: string; format: string; status: string; file_url: string; row_count: number; created_at: string; completed_at: string };
type FormData = { export_type: string; format: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const exportTypes = [
  { id: "requests", label: "Request logs", description: "All challenge/verify requests" },
  { id: "detections", label: "Detections", description: "Blocked and challenged events" },
  { id: "fingerprints", label: "Fingerprints", description: "Browser fingerprint records" },
  { id: "projects", label: "Projects", description: "Project configuration" },
  { id: "webhooks", label: "Webhook deliveries", description: "Delivery history" },
];
const formats = [
  { id: "json", label: "JSON", icon: FileJson },
  { id: "csv", label: "CSV", icon: FileSpreadsheet },
  { id: "parquet", label: "Parquet", icon: FileText },
];

const statusConfig: Record<string, { icon: any; color: string }> = {
  completed: { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
  processing: { icon: Loader2, color: "text-blue-400 bg-blue-500/10" },
  pending: { icon: Clock, color: "text-amber-400 bg-amber-500/10" },
  failed: { icon: AlertCircle, color: "text-red-400 bg-red-500/10" },
};

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormData>({ export_type: "requests", format: "json" });

  const load = async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/exports", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
    if (res.ok) {
      const body = await res.json();
      setJobs(body.jobs || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    setCreating(true);
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/exports", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (!res.ok) return toast("error", result.error || "Failed to create export");
    toast("success", "Export job started");
    await load();
    setCreating(false);
  };

  const download = async (job: ExportJob) => {
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

  return (
    <DashboardShell userType="user">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Data</p>
          <div className="mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Exports</h1>
            <p className="mt-1 text-slate-400">Export your BotShield data in multiple formats.</p>
          </div>
        </motion.div>

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">New export</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Data type</label>
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {exportTypes.map((t) => (
                  <button key={t.id} onClick={() => setForm({ ...form, export_type: t.id })} className={`rounded-xl border p-3 text-left transition ${form.export_type === t.id ? "border-blue-500/40 bg-blue-500/10" : "border-slate-700 bg-slate-950 hover:border-slate-600"}`}>
                    <p className="text-sm font-medium text-white">{t.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Format</label>
              <div className="flex gap-3">
                {formats.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button key={f.id} onClick={() => setForm({ ...form, format: f.id })} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${form.format === f.id ? "border-blue-500/40 bg-blue-500/10 text-white" : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600"}`}>
                      <Icon className="h-4 w-4" /> {f.label}
                    </button>
                  );
                })}
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
            <div className="mt-8 rounded-xl border-2 border-dashed border-slate-800 py-12 text-center">
              <Download className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">No exports yet.</p>
            </div>
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
                    return (
                      <motion.tr key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="text-slate-300">
                        <td className="py-3 pr-4 text-sm text-white">{exportTypes.find((t) => t.id === job.export_type)?.label || job.export_type}</td>
                        <td className="py-3 pr-4 font-mono text-xs uppercase text-slate-400">{job.format}</td>
                        <td className="py-3 pr-4 text-xs text-slate-400">{job.row_count?.toLocaleString() || "—"}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${st.color}`}>
                            <StIcon className={`h-3 w-3 ${job.status === "processing" ? "animate-spin" : ""}`} />
                            {job.status}
                          </span>
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
    </DashboardShell>
  );
}
