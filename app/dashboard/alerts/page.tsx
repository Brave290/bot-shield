"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Modal } from "@/components/ui/modal";
import { Select, Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { Plus, Trash2, Bell, CheckCircle2, AlertTriangle, Clock, XCircle, ToggleRight, ToggleLeft } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Policy = { id: string; name: string; metric: string; operator: string; threshold: number; window_minutes: number; severity: string; notify_emails: string[]; enabled: boolean; project_id: string; created_at: string };
type AlertEvent = { id: string; policy_id: string; policy_name: string; metric: string; value: number; threshold: number; message: string; severity: string; acknowledged_at: string | null; created_at: string };
type FormData = { name: string; metric: string; operator: string; threshold: number; window_minutes: number; severity: string; notify_emails: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const metricOptions = [
  { value: "requests_per_minute", label: "Requests per minute" },
  { value: "blocked_rate", label: "Blocked rate" },
  { value: "challenge_rate", label: "Challenge rate" },
  { value: "error_rate", label: "Error rate" },
  { value: "latency_p99", label: "Latency P99" },
  { value: "unique_ips", label: "Unique IPs" },
];
const operatorOptions = [
  { value: "gt", label: "Greater than (>)" },
  { value: "gte", label: "Greater or equal (>=)" },
  { value: "lt", label: "Less than (<)" },
  { value: "lte", label: "Less or equal (<=)" },
  { value: "eq", label: "Equal to (=)" },
];
const severityOptions = [
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];
const windowOptions = [
  { value: "5", label: "5 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "360", label: "6 hours" },
  { value: "1440", label: "24 hours" },
];

export default function AlertsPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ name: "", metric: "requests_per_minute", operator: "gt", threshold: 1000, window_minutes: 5, severity: "warning", notify_emails: "" });

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token || "";
      const [polRes, histRes] = await Promise.all([
        fetch("/api/alerts/policies", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/alerts/history", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (polRes.ok) setPolicies(await polRes.json());
      else setError("Failed to load policies");
      if (histRes.ok) setAlerts(await histRes.json());
    } catch { setError("Failed to load data"); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!form.name.trim()) return toast("error", "Enter a policy name");
    setCreating(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/alerts/policies", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          metric: form.metric,
          operator: form.operator,
          threshold: form.threshold,
          window_minutes: form.window_minutes,
          severity: form.severity,
          notify_emails: form.notify_emails ? form.notify_emails.split(",").map((e) => e.trim()) : [],
        }),
      });
      const result = await res.json();
      if (!res.ok) return toast("error", result.error || "Failed to create policy");
      toast("success", "Alert policy created");
      setForm({ name: "", metric: "requests_per_minute", operator: "gt", threshold: 1000, window_minutes: 5, severity: "warning", notify_emails: "" });
      setShowCreate(false);
      await load();
    } finally { setCreating(false); }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch(`/api/alerts/policies?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` },
      });
      if (res.ok) { toast("success", "Policy deleted"); await load(); }
      else toast("error", "Failed to delete policy");
    } finally { setDeleting(null); }
  };

  const toggleEnabled = async (policy: Policy) => {
    const { data: auth } = await supabase.auth.getSession();
    await fetch("/api/alerts/policies", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: policy.id, enabled: !policy.enabled }),
    });
    toast("success", policy.enabled ? "Policy disabled" : "Policy enabled");
    await load();
  };

  const acknowledge = async (id: string) => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/alerts/history", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "acknowledge" }),
    });
    if (res.ok) { toast("success", "Alert acknowledged"); await load(); }
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
            <p className="text-lg font-semibold text-white">Failed to load alerts</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); void load(); }} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user" userPlan="Pro">
      <PlanGate feature="alerts" currentPlan="Pro">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Monitoring</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Alert Policies</h1>
                <p className="mt-1 text-slate-400">Define thresholds and get notified when metrics cross them.</p>
              </div>
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
                <Plus className="h-4 w-4" /> New Policy
              </button>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Policies" value={policies.length} color="bg-blue-500" />
            <StatCard label="Active" value={policies.filter((p) => p.enabled).length} color="bg-emerald-500" />
            <StatCard label="Alerts triggered" value={alerts.length} color="bg-amber-500" />
            <StatCard label="Unacknowledged" value={alerts.filter((a) => !a.acknowledged_at).length} color="bg-red-500" />
          </div>

          <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create alert policy" description="Define a metric threshold and get notified when it's breached." size="lg">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="High traffic alert" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                </div>
                <Select label="Severity" value={form.severity} onChange={(v) => setForm({ ...form, severity: v })} options={severityOptions} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Select label="Metric" value={form.metric} onChange={(v) => setForm({ ...form, metric: v })} options={metricOptions} />
                <Select label="Operator" value={form.operator} onChange={(v) => setForm({ ...form, operator: v })} options={operatorOptions} />
                <Select label="Window" value={String(form.window_minutes)} onChange={(v) => setForm({ ...form, window_minutes: Number(v) })} options={windowOptions} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Threshold</label>
                <input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Notify emails (comma-separated)</label>
                <input value={form.notify_emails} onChange={(e) => setForm({ ...form, notify_emails: e.target.value })} placeholder="admin@example.com" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={create} disabled={creating} className="px-5 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors">
                  {creating ? "Creating..." : "Create policy"}
                </button>
              </div>
            </div>
          </Modal>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Policies</h2>
            {policies.length === 0 ? (
              <EmptyState icon={<Bell className="h-8 w-8 text-slate-600" />} title="No alert policies" description="Create a policy to start monitoring metrics and receiving alerts." action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition"><Plus className="h-4 w-4" /> Create Policy</button>} />
            ) : (
              <div className="mt-4 space-y-3">
                <AnimatePresence>
                  {policies.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.05 }} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          When <span className="font-mono text-blue-400">{p.metric.replace(/_/g, " ")}</span> {p.operator} <span className="font-mono text-amber-400">{p.threshold}</span> per {p.window_minutes}min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.severity === "critical" ? "danger" : p.severity === "warning" ? "warning" : "info"}>{p.severity}</Badge>
                        <button onClick={() => toggleEnabled(p)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${p.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                          {p.enabled ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                          {p.enabled ? "On" : "Off"}
                        </button>
                        <button onClick={() => remove(p.id)} disabled={deleting === p.id} className="rounded-lg border border-red-500/20 p-1.5 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.section>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Alert history</h2>
            <div className="mt-4 space-y-2">
              {alerts.length === 0 ? (
                <EmptyState icon={<Clock className="h-8 w-8 text-slate-600" />} title="No alerts triggered" description="When a policy threshold is breached, alerts will appear here." />
              ) : alerts.map((a) => (
                <div key={a.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 transition ${a.acknowledged_at ? "bg-slate-950/50" : "bg-amber-500/5 border border-amber-500/20"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {a.acknowledged_at ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                      <p className="text-sm font-medium text-white">{a.policy_name}</p>
                      <Badge variant={a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "info"}>{a.severity}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{a.message} · Value: <span className="font-mono text-amber-400">{a.value}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500"><Clock className="mr-1 inline h-3 w-3" />{new Date(a.created_at).toLocaleString()}</span>
                    {!a.acknowledged_at && (
                      <button onClick={() => acknowledge(a.id)} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10">
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </PlanGate>
    </DashboardShell>
  );
}
