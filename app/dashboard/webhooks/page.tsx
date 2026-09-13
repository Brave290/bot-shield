"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Plus, Trash2, RotateCcw, Bell, CheckCircle2, XCircle, Clock } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Webhook = { id: string; endpoint_url: string; secret: string; events: string[]; active: boolean; created_at: string };
type Delivery = { id: string; webhook_id: string; event_type: string; status: string; status_code: number; response_body: string; created_at: string };
type FormData = { endpoint_url: string; events: string[] };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const eventOptions = ["detection.blocked", "detection.challenged", "detection.passed", "project.created", "key.rotated"];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormData>({ endpoint_url: "", events: ["detection.blocked"] });

  const load = async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/webhooks", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
    if (res.ok) {
      const body = await res.json();
      setWebhooks(body.webhooks || []);
      setDeliveries(body.deliveries || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!form.endpoint_url) return toast("error", "Enter an endpoint URL");
    setCreating(true);
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (!res.ok) return toast("error", result.error || "Failed to create webhook");
    toast("success", "Webhook created");
    setForm({ endpoint_url: "", events: ["detection.blocked"] });
    setShowForm(false);
    await load();
    setCreating(false);
  };

  const remove = async (id: string) => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/webhooks", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast("success", "Webhook deleted"); await load(); }
    else toast("error", "Failed to delete webhook");
  };

  const toggle = async (webhook: Webhook) => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/webhooks", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: webhook.id, active: !webhook.active }),
    });
    if (res.ok) { toast("success", webhook.active ? "Webhook paused" : "Webhook enabled"); await load(); }
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

  return (
    <DashboardShell userType="user">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Integrations</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Webhooks</h1>
              <p className="mt-1 text-slate-400">Receive real-time notifications when events occur.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
              <Plus className="h-4 w-4" /> New Webhook
            </button>
          </div>
        </motion.div>

        {showForm && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Create webhook endpoint</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Endpoint URL</label>
                <input value={form.endpoint_url} onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} placeholder="https://your-app.com/webhook" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Events</label>
                <div className="flex flex-wrap gap-2">
                  {eventOptions.map((event) => (
                    <button key={event} onClick={() => toggleEvent(event)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${form.events.includes(event) ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"}`}>
                      {event}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={create} disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
                  {creating ? "Creating..." : "Create webhook"}
                </button>
                <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-400 transition hover:text-white">Cancel</button>
              </div>
            </div>
          </motion.section>
        )}

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Endpoints</h2>
            <span className="text-xs text-slate-500">{webhooks.length} total</span>
          </div>
          {webhooks.length === 0 ? (
            <div className="mt-8 rounded-xl border-2 border-dashed border-slate-800 py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">No webhooks configured yet.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {webhooks.map((wh, i) => (
                <motion.div key={wh.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{wh.endpoint_url}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {wh.events?.map((ev) => <span key={ev} className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{ev}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${wh.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                      {wh.active ? "Active" : "Paused"}
                    </span>
                    <button onClick={() => toggle(wh)} className="rounded-lg border border-slate-700 p-2 text-slate-400 transition hover:text-white" title={wh.active ? "Pause" : "Enable"}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(wh.id)} className="rounded-lg border border-red-500/20 p-2 text-red-400 transition hover:bg-red-500/10" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Delivery history</h2>
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
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${d.status === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {d.status === "success" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {d.status}
                      </span>
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
    </DashboardShell>
  );
}
