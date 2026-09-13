"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Plus, AlertTriangle, AlertOctagon, Info, ChevronRight, X, MessageSquare } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Incident = { id: string; title: string; severity: string; status: string; description: string; notes: Array<{ id: string; content: string; author: string; created_at: string }>; created_at: string };
type FormData = { title: string; severity: string; description: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const severityConfig: Record<string, { color: string; icon: any; label: string }> = {
  critical: { color: "bg-red-500/10 text-red-400 border-red-500/30", icon: AlertOctagon, label: "Critical" },
  high: { color: "bg-orange-500/10 text-orange-400 border-orange-500/30", icon: AlertTriangle, label: "High" },
  medium: { color: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: AlertTriangle, label: "Medium" },
  low: { color: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Info, label: "Low" },
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [creating, setCreating] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [form, setForm] = useState<FormData>({ title: "", severity: "medium", description: "" });

  const load = async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/incidents", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
    if (res.ok) {
      const body = await res.json();
      setIncidents(body.incidents || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!form.title.trim()) return toast("error", "Enter an incident title");
    setCreating(true);
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (!res.ok) return toast("error", result.error || "Failed to create incident");
    toast("success", "Incident created");
    setForm({ title: "", severity: "medium", description: "" });
    setShowForm(false);
    await load();
    setCreating(false);
  };

  const addNote = async () => {
    if (!selected || !noteText.trim()) return;
    const { data: auth } = await supabase.auth.getSession();
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, action: "add_note", content: noteText }),
    });
    setNoteText("");
    toast("success", "Note added");
    await load();
    const updated = incidents.find((i) => i.id === selected.id);
    if (updated) setSelected({ ...updated, notes: [...(updated.notes || []), { id: "temp", content: noteText, author: "You", created_at: new Date().toISOString() }] });
  };

  const closeIncident = async (id: string) => {
    const { data: auth } = await supabase.auth.getSession();
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "close" }),
    });
    toast("success", "Incident closed");
    setSelected(null);
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Operations</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Incidents</h1>
              <p className="mt-1 text-slate-400">Track, investigate, and resolve security incidents.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
              <Plus className="h-4 w-4" /> New Incident
            </button>
          </div>
        </motion.div>

        {showForm && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Report incident</h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Suspected credential stuffing attack" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the incident..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={create} disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
                  {creating ? "Creating..." : "Create incident"}
                </button>
                <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-400 transition hover:text-white">Cancel</button>
              </div>
            </div>
          </motion.section>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Active incidents</h2>
            {incidents.length === 0 ? (
              <div className="mt-8 rounded-xl border-2 border-dashed border-slate-800 py-12 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-3 text-sm text-slate-500">No incidents reported.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {incidents.map((inc, i) => {
                  const sev = severityConfig[inc.severity] || severityConfig.medium;
                  const SevIcon = sev.icon;
                  return (
                    <motion.button key={inc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelected(inc)} className={`w-full text-left rounded-xl p-4 transition hover:bg-slate-800/50 ${selected?.id === inc.id ? "bg-slate-800/50 border border-blue-500/30" : "bg-slate-950 border border-transparent"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <SevIcon className={`h-4 w-4 shrink-0 ${sev.color.split(" ").slice(1).join(" ").split(" ").find((c) => c.startsWith("text-")) || "text-slate-400"}`} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{inc.title}</p>
                            <p className="text-xs text-slate-500">{new Date(inc.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${sev.color}`}>{sev.label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${inc.status === "open" ? "bg-amber-500/10 text-amber-400" : "bg-slate-800 text-slate-500"}`}>{inc.status}</span>
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
                      <p className={`mt-1 text-sm font-medium ${(severityConfig[selected.severity] || severityConfig.medium).color.split(" ").find((c) => c.startsWith("text-"))}`}>{(severityConfig[selected.severity] || severityConfig.medium).label}</p>
                    </div>
                    <div className="flex-1 rounded-xl bg-slate-950 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Status</p>
                      <p className="mt-1 text-sm font-medium text-white">{selected.status}</p>
                    </div>
                  </div>
                  {selected.status === "open" && (
                    <button onClick={() => closeIncident(selected.id)} className="w-full rounded-xl border border-emerald-500/30 px-4 py-2.5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/10">
                      Close incident
                    </button>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Notes ({selected.notes?.length || 0})</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selected.notes?.map((n) => (
                        <div key={n.id} className="rounded-lg bg-slate-950 p-3">
                          <p className="text-xs text-slate-300">{n.content}</p>
                          <p className="mt-1 text-[10px] text-slate-500">{n.author} · {new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Add a note..." className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                      <button onClick={addNote} className="rounded-xl bg-blue-600 px-3 py-2 text-xs text-white transition hover:bg-blue-500"><MessageSquare className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
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
    </DashboardShell>
  );
}
