"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Select, Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { toast } from "@/components/toast";
import { motion } from "framer-motion";
import {
  ShieldAlert, Plus, Trash2, ToggleLeft, ToggleRight,
  Loader2, AlertTriangle, Activity, X,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WafRule = {
  id: string;
  name: string;
  description: string;
  action: string;
  priority: number;
  enabled: boolean;
  conditions: Record<string, unknown>;
  created_at: string;
};

type WafEvent = {
  id: string;
  rule_name: string;
  source_ip: string;
  path: string;
  action: string;
  timestamp: string;
};

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function WafPage() {
  const [rules, setRules] = useState<WafRule[]>([]);
  const [events, setEvents] = useState<WafEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteRule, setDeleteRule] = useState<WafRule | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAction, setFormAction] = useState("block");
  const [formPriority, setFormPriority] = useState("100");

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const [rulesRes, eventsRes] = await Promise.all([
        fetch("/api/products/waf", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/products/waf/events", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!rulesRes.ok) throw new Error("Failed to load rules");
      const rulesData = await rulesRes.json();
      setRules(Array.isArray(rulesData) ? rulesData : []);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setFormName(""); setFormDesc(""); setFormAction("block"); setFormPriority("100"); };

  const handleCreate = async () => {
    if (!formName.trim()) { toast("error", "Rule name is required"); return; }
    const token = await getToken();
    const res = await fetch("/api/products/waf", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-rule", name: formName, description: formDesc, rule_action: formAction, priority: Number(formPriority) }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to create rule"); return; }
    toast("success", "Rule created");
    setShowCreate(false);
    resetForm();
    load();
  };

  const handleToggle = async (rule: WafRule) => {
    setTogglingId(rule.id);
    const token = await getToken();
    const res = await fetch("/api/products/waf", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-rule", rule_id: rule.id }),
    });
    setTogglingId(null);
    if (!res.ok) { toast("error", "Failed to toggle rule"); return; }
    load();
  };

  const handleDelete = async () => {
    if (!deleteRule) return;
    const token = await getToken();
    const res = await fetch("/api/products/waf", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-rule", rule_id: deleteRule.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete rule"); return; }
    toast("success", "Rule deleted");
    setDeleteRule(null);
    load();
  };

  const actionColor = (a: string) => {
    if (a === "block") return "danger";
    if (a === "challenge") return "warning";
    if (a === "allow") return "success";
    return "default";
  };

  return (
    <DashboardShell userType="user">
      <PlanGate feature="waf" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Web Application Firewall</p>
              <Badge variant="info">BotShield WAF</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">WAF Rules</h1>
            <p className="mt-1 text-slate-400">Configure firewall rules to protect your applications from common attacks.</p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <motion.div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center" variants={fadeIn} initial="hidden" animate="visible">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={load} className="mt-3 text-sm text-blue-400 hover:underline">Retry</button>
            </motion.div>
          ) : (
            <>
              <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" variants={fadeIn} initial="hidden" animate="visible">
                <StatCard label="Total Rules" value={rules.length} color="bg-blue-500" />
                <StatCard label="Active Rules" value={rules.filter((r) => r.enabled).length} color="bg-emerald-500" />
                <StatCard label="Events" value={events.length} color="bg-violet-500" />
                <StatCard label="Blocked" value={events.filter((e) => e.action === "blocked").length} color="bg-red-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Firewall Rules</h2>
                    <p className="mt-1 text-sm text-slate-400">Toggle rules on/off and manage your protection policies.</p>
                  </div>
                  <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> Add Rule
                  </button>
                </div>
                {rules.length === 0 ? (
                  <EmptyState icon={<ShieldAlert className="h-8 w-8 text-slate-500" />} title="No WAF rules" description="Create firewall rules to protect your applications." action={
                    <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                      <Plus className="h-4 w-4" /> Add Rule
                    </button>
                  } />
                ) : (
                  <div className="mt-4 space-y-3">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <ShieldAlert className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{rule.name}</p>
                            <p className="text-xs text-slate-500 max-w-md truncate">{rule.description || "No description"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={actionColor(rule.action) as any}>{rule.action}</Badge>
                          <span className="text-xs text-slate-500">P{rule.priority}</span>
                          <button onClick={() => handleToggle(rule)} disabled={togglingId === rule.id} className="text-slate-400 transition hover:text-white disabled:opacity-50">
                            {togglingId === rule.id ? <Loader2 className="h-6 w-6 animate-spin" /> : rule.enabled ? <ToggleRight className="h-6 w-6 text-green-400" /> : <ToggleLeft className="h-6 w-6" />}
                          </button>
                          <button onClick={() => setDeleteRule(rule)} className="p-2 text-slate-400 hover:text-red-400 transition"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <h2 className="text-xl font-semibold text-white">Recent Events</h2>
                {events.length === 0 ? (
                  <EmptyState icon={<Activity className="h-8 w-8 text-slate-500" />} title="No events yet" description="Events will appear here when rules are triggered." />
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-3 font-medium">Rule</th>
                          <th className="pb-3 font-medium">Source IP</th>
                          <th className="pb-3 font-medium">Path</th>
                          <th className="pb-3 font-medium">Action</th>
                          <th className="pb-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {events.slice(0, 20).map((event) => (
                          <tr key={event.id} className="hover:bg-slate-900/50">
                            <td className="py-3 text-white">{event.rule_name}</td>
                            <td className="py-3 text-slate-400 font-mono text-xs">{event.source_ip}</td>
                            <td className="py-3 text-slate-400 max-w-[200px] truncate">{event.path}</td>
                            <td className="py-3"><Badge variant={event.action === "blocked" ? "danger" : event.action === "challenged" ? "warning" : "default"}>{event.action}</Badge></td>
                            <td className="py-3 text-slate-500 text-xs">{new Date(event.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.section>
            </>
          )}
        </div>
      </PlanGate>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create WAF Rule" description="Define a new firewall rule to protect your applications.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Rule Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Block SQL Injection" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe what this rule does..." rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formAction} onChange={setFormAction} label="Action" options={[{ value: "block", label: "Block" }, { value: "challenge", label: "Challenge" }, { value: "allow", label: "Allow" }, { value: "log", label: "Log" }]} />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority (0-1000)</label>
            <input type="number" value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Create Rule</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteRule} onClose={() => setDeleteRule(null)} onConfirm={handleDelete} title="Delete Rule" message={`Are you sure you want to delete "${deleteRule?.name}"?`} confirmLabel="Delete" danger />
    </DashboardShell>
  );
}
