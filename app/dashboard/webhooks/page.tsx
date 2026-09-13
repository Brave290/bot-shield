"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Modal } from "@/components/ui/modal";
import { Select, Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { Plus, Trash2, Globe, CheckCircle2, XCircle, Clock, ToggleRight, ToggleLeft, Webhook, Send } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Endpoint = { id: string; url: string; events: string[]; secret: string; active: boolean; project_id: string; created_at: string };
type Delivery = { id: string; endpoint_id: string; event_type: string; status: string; status_code: number; response_body: string; created_at: string };
type FormData = { url: string; events: string[]; secret: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const eventOptions = ["detection.blocked", "detection.challenged", "detection.passed", "project.created", "key.rotated"];

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ url: "", events: ["detection.blocked"], secret: "" });

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token || "";
      const [epRes, delRes] = await Promise.all([
        fetch("/api/webhooks/endpoints", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/webhooks/deliveries", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (epRes.ok) setEndpoints(await epRes.json());
      else setError("Failed to load endpoints");
      if (delRes.ok) setDeliveries(await delRes.json());
    } catch { setError("Failed to load data"); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!form.url.trim()) return toast("error", "Enter an endpoint URL");
    if (!form.url.startsWith("https://")) return toast("error", "URL must use HTTPS");
    if (form.events.length === 0) return toast("error", "Select at least one event");
    setCreating(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/webhooks/endpoints", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url, events: form.events, secret: form.secret || undefined }),
      });
      const result = await res.json();
      if (!res.ok) return toast("error", result.error || "Failed to create endpoint");
      toast("success", "Webhook endpoint created");
      setForm({ url: "", events: ["detection.blocked"], secret: "" });
      setShowCreate(false);
      await load();
    } finally { setCreating(false); }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch(`/api/webhooks/endpoints?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` },
      });
      if (res.ok) { toast("success", "Endpoint deleted"); await load(); }
      else toast("error", "Failed to delete endpoint");
    } finally { setDeleting(null); }
  };

  const toggleActive = async (ep: Endpoint) => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/webhooks/endpoints", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: ep.url, events: ep.events, active: !ep.active }),
    });
    if (res.ok) { toast("success", ep.active ? "Endpoint paused" : "Endpoint enabled"); await load(); }
  };

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter((e) => e !== event) : [...prev.events, event],
    }));
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
            <p className="text-lg font-semibold text-white">Failed to load webhooks</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); void load(); }} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user" userPlan="Pro">
      <PlanGate feature="webhooks" currentPlan="Pro">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Integrations</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Webhooks</h1>
                <p className="mt-1 text-slate-400">Receive real-time notifications when events occur.</p>
              </div>
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
                <Plus className="h-4 w-4" /> New Endpoint
              </button>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Endpoints" value={endpoints.length} color="bg-blue-500" />
            <StatCard label="Active" value={endpoints.filter((e) => e.active).length} color="bg-emerald-500" />
            <StatCard label="Deliveries (24h)" value={deliveries.filter((d) => Date.now() - new Date(d.created_at).getTime() < 86400000).length} color="bg-violet-500" />
          </div>

          <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create webhook endpoint" description="Add a new HTTPS endpoint to receive event notifications.">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Endpoint URL</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://your-app.com/webhook" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Events</label>
                <div className="flex flex-wrap gap-2">
                  {eventOptions.map((event) => (
                    <button key={event} onClick={() => toggleEvent(event)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${form.events.includes(event) ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"}`}>
                      {event}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Secret (optional, min 16 chars)</label>
                <input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="whsec_..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={create} disabled={creating} className="px-5 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors">
                  {creating ? "Creating..." : "Create endpoint"}
                </button>
              </div>
            </div>
          </Modal>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Endpoints</h2>
              <Badge variant="info">{endpoints.length} total</Badge>
            </div>
            {endpoints.length === 0 ? (
              <EmptyState icon={<Webhook className="h-8 w-8 text-slate-600" />} title="No webhook endpoints" description="Create an endpoint to start receiving event notifications." action={<button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition"><Plus className="h-4 w-4" /> Create Endpoint</button>} />
            ) : (
              <div className="mt-4 space-y-3">
                <AnimatePresence>
                  {endpoints.map((ep, i) => (
                    <motion.div key={ep.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.05 }} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{ep.url}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {ep.events?.map((ev) => <Badge key={ev} variant="default">{ev}</Badge>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(ep)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${ep.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                          {ep.active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                          {ep.active ? "Active" : "Paused"}
                        </button>
                        <button onClick={() => remove(ep.id)} disabled={deleting === ep.id} className="rounded-lg border border-red-500/20 p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50" title="Delete">
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Delivery history</h2>
              <Badge variant="default">{deliveries.length} total</Badge>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3 pr-4">Event</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Code</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {deliveries.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-500">No deliveries yet.</td></tr>
                  ) : deliveries.map((d) => (
                    <tr key={d.id} className="text-slate-300">
                      <td className="py-3 pr-4 font-mono text-xs">{d.event_type}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={d.status === "success" ? "success" : "danger"}>
                          {d.status === "success" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-500">{d.status_code || "—"}</td>
                      <td className="py-3 text-xs text-slate-500"><Clock className="mr-1 inline h-3 w-3" />{new Date(d.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>
      </PlanGate>
    </DashboardShell>
  );
}
