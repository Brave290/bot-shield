"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Modal } from "@/components/ui/modal";
import { Select, Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { Plus, AlertTriangle, AlertOctagon, Info, ChevronRight, X, MessageSquare, XCircle } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Incident = { id: string; title: string; description: string; severity: string; status: string; affected_endpoints: string[]; created_at: string; updated_at: string; resolved_at: string | null; closed_at: string | null };
type FormData = { title: string; severity: string; description: string; affected_endpoints: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const severityConfig: Record<string, { color: string; icon: any; label: string; badge: "danger" | "warning" | "info" | "default" }> = {
  critical: { color: "text-red-400", icon: AlertOctagon, label: "Critical", badge: "danger" },
  high: { color: "text-orange-400", icon: AlertTriangle, label: "High", badge: "warning" },
  medium: { color: "text-amber-400", icon: AlertTriangle, label: "Medium", badge: "warning" },
  low: { color: "text-blue-400", icon: Info, label: "Low", badge: "info" },
};
const statusOptions = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];
const severitySelectOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ title: "", severity: "medium", description: "", affected_endpoints: "" });

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/incidents", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
      if (res.ok) setIncidents(await res.json());
      else setError("Failed to load incidents");
    } catch { setError("Failed to load data"); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!form.title.trim()) return toast("error", "Enter an incident title");
    setCreating(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          severity: form.severity,
          description: form.description,
          affected_endpoints: form.affected_endpoints ? form.affected_endpoints.split(",").map((e) => e.trim()) : [],
        }),
      });
      const result = await res.json();
      if (!res.ok) return toast("error", result.error || "Failed to create incident");
      toast("success", "Incident created");
      setForm({ title: "", severity: "medium", description: "", affected_endpoints: "" });
      setShowCreate(false);
      await load();
    } finally { setCreating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/incidents", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) { toast("success", `Incident ${status}`); await load(); setSelected(null); }
      else toast("error", "Failed to update incident");
    } finally { setUpdating(null); }
  };

  const remove = async (id: string) => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch(`/api/incidents?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` },
    });
    if (res.ok) { toast("success", "Incident deleted"); await load(); setSelected(null); }
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
            <p className="text-lg font-semibold text-white">Failed to load incidents</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); void load(); }} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user" userPlan="Pro">
      <PlanGate feature="incidents" currentPlan="Pro">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Operations</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Incidents</h1>
                <p className="mt-1 text-slate-400">Track, investigate, and resolve security incidents.</p>
              </div>
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
                <Plus className="h-4 w-4" /> New Incident
              </button>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={incidents.length} color="bg-blue-500" />
            <StatCard label="Open" value={incidents.filter((i) => i.status === "open").length} color="bg-amber-500" />
            <StatCard label="Investigating" value={incidents.filter((i) => i.status === "investigating").length} color="bg-violet-500" />
            <StatCard label="Resolved" value={incidents.filter((i) => i.status === "resolved" || i.status === "closed").length} color="bg-emerald-500" />
          </div>

          <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Report incident" description="Create a new security incident for tracking and resolution." size="lg">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Suspected credential stuffing attack" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                </div>
                <Select label="Severity" value={form.severity} onChange={(v) => setForm({ ...form, severity: v })} options={severitySelectOptions} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the incident..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Affected endpoints (comma-separated)</label>
                <input value={form.affected_endpoints} onChange={(e) => setForm({ ...form, affected_endpoints: e.target.value })} placeholder="/api/login, /api/checkout" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={create} disabled={creating} className="px-5 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors">
                  {creating ? "Creating..." : "Create incident"}
                </button>
              </div>
            </div>
          </Modal>

          <div className="grid gap-6 lg:grid-cols-3">
            <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-white">Active incidents</h2>
              {incidents.length === 0 ? (
                <EmptyState icon={<AlertTriangle className="h-8 w-8 text-slate-600" />} title="No incidents" description="When security incidents are reported, they'll appear here." action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition"><Plus className="h-4 w-4" /> Report Incident</button>} />
              ) : (
                <div className="mt-4 space-y-2">
                  {incidents.map((inc, i) => {
                    const sev = severityConfig[inc.severity] || severityConfig.medium;
                    const SevIcon = sev.icon;
                    return (
                      <motion.button key={inc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelected(inc)} className={`w-full text-left rounded-xl p-4 transition hover:bg-slate-800/50 ${selected?.id === inc.id ? "bg-slate-800/50 border border-blue-500/30" : "bg-slate-950 border border-transparent"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <SevIcon className={`h-4 w-4 shrink-0 ${sev.color}`} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{inc.title}</p>
                              <p className="text-xs text-slate-500">{new Date(inc.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={sev.badge}>{sev.label}</Badge>
                            <Badge variant={inc.status === "open" ? "warning" : inc.status === "resolved" ? "success" : "default"}>{inc.status}</Badge>
                            <ChevronRight className="h-4 w-4 text-slate-600" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.section>

            <AnimatePresence mode="wait">
              {selected ? (
                <motion.section key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Details</h2>
                    <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Title</p>
                      <p className="mt-1 text-sm text-white">{selected.title}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Description</p>
                      <p className="mt-1 text-sm text-slate-300">{selected.description || "No description"}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 rounded-xl bg-slate-950 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Severity</p>
                        <p className={`mt-1 text-sm font-medium ${(severityConfig[selected.severity] || severityConfig.medium).color}`}>{(severityConfig[selected.severity] || severityConfig.medium).label}</p>
                      </div>
                      <div className="flex-1 rounded-xl bg-slate-950 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">Status</p>
                        <p className="mt-1 text-sm font-medium text-white capitalize">{selected.status}</p>
                      </div>
                    </div>
                    {selected.affected_endpoints && selected.affected_endpoints.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Affected endpoints</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.affected_endpoints.map((ep) => <Badge key={ep} variant="default">{ep}</Badge>)}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {selected.status === "open" && (
                        <button onClick={() => updateStatus(selected.id, "investigating")} disabled={updating === selected.id} className="flex-1 rounded-xl border border-violet-500/30 px-4 py-2.5 text-sm font-medium text-violet-400 transition hover:bg-violet-500/10 disabled:opacity-50">
                          Investigate
                        </button>
                      )}
                      {(selected.status === "open" || selected.status === "investigating") && (
                        <button onClick={() => updateStatus(selected.id, "resolved")} disabled={updating === selected.id} className="flex-1 rounded-xl border border-emerald-500/30 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50">
                          Resolve
                        </button>
                      )}
                    </div>
                    <button onClick={() => remove(selected.id)} className="w-full rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
                      Delete incident
                    </button>
                  </div>
                </motion.section>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden lg:flex rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 items-center justify-center p-6 min-h-[300px]">
                  <p className="text-sm text-slate-500">Select an incident to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </PlanGate>
    </DashboardShell>
  );
}
