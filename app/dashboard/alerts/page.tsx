"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Plus, Trash2, Bell, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Policy = { id: string; name: string; metric: string; threshold: number; action: string; enabled: boolean; created_at: string };
type AlertEvent = { id: string; policy_id: string; policy_name: string; value: number; message: string; acknowledged: boolean; created_at: string };
type FormData = { name: string; metric: string; threshold: number; action: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const metrics = ["requests_per_minute", "blocked_rate", "challenge_rate", "error_rate", "latency_p99", "unique_ips"];

export default function AlertsPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormData>({ name: "", metric: "requests_per_minute", threshold: 1000, action: "email" });

  const load = async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/alerts", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
    if (res.ok) {
      const body = await res.json();
      setPolicies(body.policies || []);
      setAlerts(body.alerts || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return toast("error", "Enter a policy name");
    setCreating(true);
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (!res.ok) return toast("error", result.error || "Failed to create policy");
    toast("success", "Policy created");
    setForm({ name: "", metric: "requests_per_minute", threshold: 1000, action: "email" });
    setShowForm(false);
    await load();
    setCreating(false);
  };

  const remove = async (id: string) => {
    const { data: auth } = await supabase.auth.getSession();
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast("success", "Policy deleted");
    await load();
  };

  const toggle = async (policy: Policy) => {
    const { data: auth } = await supabase.auth.getSession();
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: policy.id, enabled: !policy.enabled }),
    });
    await load();
  };

  const acknowledge = async (id: string) => {
    const { data: auth } = await supabase.auth.getSession();
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: id, acknowledged: true }),
    });
    toast("success", "Alert acknowledged");
    await load();
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Monitoring</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Alert Policies</h1>
              <p className="mt-1 text-slate-400">Define thresholds and get notified when metrics cross them.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
              <Plus className="h-4 w-4" /> New Policy
            </button>
          </div>
        </motion.div>

        {showForm && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Create alert policy</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="High traffic alert" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Metric</label>
                <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
                  {metrics.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Threshold</label>
                <input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Action</label>
                <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
                  <option value="email">Email</option>
                  <option value="webhook">Webhook</option>
                  <option value="slack">Slack</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={create} disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
                {creating ? "Creating..." : "Create policy"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-400 transition hover:text-white">Cancel</button>
            </div>
          </motion.section>
        )}

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Policies</h2>
          {policies.length === 0 ? (
            <div className="mt-8 rounded-xl border-2 border-dashed border-slate-800 py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">No alert policies configured.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {policies.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      When <span className="font-mono text-blue-400">{p.metric.replace(/_/g, " ")}</span> &gt; <span className="font-mono text-amber-400">{p.threshold}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${p.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                      {p.enabled ? "On" : "Off"}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-400">{p.action}</span>
                    <button onClick={() => toggle(p)} className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-400 transition hover:text-white">
                      {p.enabled ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => remove(p.id)} className="rounded-lg border border-red-500/20 p-1.5 text-red-400 transition hover:bg-red-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Alert history</h2>
          <div className="mt-4 space-y-2">
            {alerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No alerts triggered yet.</p>
            ) : alerts.map((a) => (
              <div key={a.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 ${a.acknowledged ? "bg-slate-950/50" : "bg-amber-500/5 border border-amber-500/20"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {a.acknowledged ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                    <p className="text-sm font-medium text-white">{a.policy_name}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{a.message} · Value: <span className="font-mono text-amber-400">{a.value}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500"><Clock className="mr-1 inline h-3 w-3" />{new Date(a.created_at).toLocaleString()}</span>
                  {!a.acknowledged && (
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
    </DashboardShell>
  );
}
