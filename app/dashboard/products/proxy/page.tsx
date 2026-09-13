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
  Globe, Plus, Trash2, Edit, Loader2, AlertTriangle,
  CheckCircle, XCircle, Server, Activity,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProxyConfig = {
  id: string;
  name: string;
  upstream_url: string;
  method: string;
  rate_limit: number;
  timeout_ms: number;
  enabled: boolean;
  created_at: string;
};

type ProxyLog = {
  id: string;
  config_name: string;
  method: string;
  path: string;
  status_code: number;
  latency_ms: number;
  created_at: string;
};

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function ProxyPage() {
  const [configs, setConfigs] = useState<ProxyConfig[]>([]);
  const [logs, setLogs] = useState<ProxyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editConfig, setEditConfig] = useState<ProxyConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<ProxyConfig | null>(null);

  const [formName, setFormName] = useState("");
  const [formUpstream, setFormUpstream] = useState("");
  const [formMethod, setFormMethod] = useState("*");
  const [formRateLimit, setFormRateLimit] = useState("0");
  const [formTimeout, setFormTimeout] = useState("30000");

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const [configsRes, logsRes] = await Promise.all([
        fetch("/api/products/proxy", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/products/proxy/logs", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!configsRes.ok) throw new Error("Failed to load configs");
      const configsData = await configsRes.json();
      setConfigs(Array.isArray(configsData) ? configsData : []);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(Array.isArray(logsData) ? logsData : []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setFormName(""); setFormUpstream(""); setFormMethod("*"); setFormRateLimit("0"); setFormTimeout("30000"); };

  const handleCreate = async () => {
    if (!formName.trim() || !formUpstream.trim()) { toast("error", "Name and upstream URL are required"); return; }
    const token = await getToken();
    const res = await fetch("/api/products/proxy", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-config", name: formName, upstream_url: formUpstream, method: formMethod, rate_limit: Number(formRateLimit), timeout_ms: Number(formTimeout) }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to create config"); return; }
    toast("success", "Config created");
    setShowCreate(false);
    resetForm();
    load();
  };

  const handleEdit = async () => {
    if (!editConfig) return;
    const token = await getToken();
    const res = await fetch("/api/products/proxy", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-config", config_id: editConfig.id, name: formName, upstream_url: formUpstream, method: formMethod, rate_limit: Number(formRateLimit), timeout_ms: Number(formTimeout) }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to update"); return; }
    toast("success", "Config updated");
    setEditConfig(null);
    resetForm();
    load();
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    const token = await getToken();
    const res = await fetch("/api/products/proxy", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-config", config_id: deleteConfig.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete config"); return; }
    toast("success", "Config deleted");
    setDeleteConfig(null);
    load();
  };

  const openEdit = (c: ProxyConfig) => {
    setFormName(c.name);
    setFormUpstream(c.upstream_url);
    setFormMethod(c.method);
    setFormRateLimit(String(c.rate_limit));
    setFormTimeout(String(c.timeout_ms));
    setEditConfig(c);
  };

  return (
    <DashboardShell userType="user">
      <PlanGate feature="proxy" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Reverse Proxy</p>
              <Badge variant="info">BotShield Proxy</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Proxy Configurations</h1>
            <p className="mt-1 text-slate-400">Route and protect your traffic through BotShield&apos;s reverse proxy layer.</p>
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
                <StatCard label="Configurations" value={configs.length} color="bg-blue-500" />
                <StatCard label="Active" value={configs.filter((c) => c.enabled).length} color="bg-emerald-500" />
                <StatCard label="Logs" value={logs.length} color="bg-violet-500" />
                <StatCard label="Avg Timeout" value={`${configs.length ? Math.round(configs.reduce((s, c) => s + c.timeout_ms, 0) / configs.length) : 0}ms`} color="bg-amber-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Configurations</h2>
                    <p className="mt-1 text-sm text-slate-400">Manage your proxy endpoints and upstream servers.</p>
                  </div>
                  <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> Add Config
                  </button>
                </div>
                {configs.length === 0 ? (
                  <EmptyState icon={<Globe className="h-8 w-8 text-slate-500" />} title="No proxy configs" description="Create a proxy configuration to route traffic." action={
                    <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                      <Plus className="h-4 w-4" /> Add Config
                    </button>
                  } />
                ) : (
                  <div className="mt-4 space-y-3">
                    {configs.map((config) => (
                      <div key={config.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <Globe className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{config.name}</p>
                            <p className="font-mono text-xs text-slate-500">{config.upstream_url}</p>
                            <p className="text-xs text-slate-600">Method: {config.method} &middot; Timeout: {config.timeout_ms}ms</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={config.enabled ? "success" : "default"}>{config.enabled ? "Enabled" : "Disabled"}</Badge>
                          <button onClick={() => openEdit(config)} className="p-2 text-slate-400 hover:text-white transition"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteConfig(config)} className="p-2 text-slate-400 hover:text-red-400 transition"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <h2 className="text-xl font-semibold text-white">Recent Logs</h2>
                {logs.length === 0 ? (
                  <EmptyState icon={<Activity className="h-8 w-8 text-slate-500" />} title="No logs yet" description="Proxy logs will appear here once traffic flows." />
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-3 font-medium">Config</th>
                          <th className="pb-3 font-medium">Method</th>
                          <th className="pb-3 font-medium">Path</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Latency</th>
                          <th className="pb-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {logs.slice(0, 20).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/50">
                            <td className="py-3 text-white">{log.config_name}</td>
                            <td className="py-3"><span className={`rounded px-1.5 py-0.5 text-xs font-mono ${log.method === "GET" ? "bg-blue-500/10 text-blue-400" : log.method === "POST" ? "bg-green-500/10 text-green-400" : "bg-slate-700 text-slate-300"}`}>{log.method}</span></td>
                            <td className="py-3 font-mono text-xs text-slate-400 max-w-[200px] truncate">{log.path}</td>
                            <td className="py-3">{log.status_code >= 200 && log.status_code < 300 ? <CheckCircle className="h-4 w-4 text-green-400" /> : log.status_code >= 500 ? <XCircle className="h-4 w-4 text-red-400" /> : <span className="text-sm text-amber-400">{log.status_code}</span>}</td>
                            <td className="py-3 text-slate-400">{log.latency_ms}ms</td>
                            <td className="py-3 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Proxy Config" description="Configure a new reverse proxy endpoint.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My API Proxy" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Upstream URL</label>
            <input value={formUpstream} onChange={(e) => setFormUpstream(e.target.value)} placeholder="https://api.example.com" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formMethod} onChange={setFormMethod} label="Method" options={[{ value: "*", label: "All Methods" }, { value: "GET", label: "GET" }, { value: "POST", label: "POST" }, { value: "PUT", label: "PUT" }, { value: "DELETE", label: "DELETE" }]} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Rate Limit (0 = unlimited)</label>
              <input type="number" value={formRateLimit} onChange={(e) => setFormRateLimit(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Timeout (ms)</label>
              <input type="number" value={formTimeout} onChange={(e) => setFormTimeout(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Create Config</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editConfig} onClose={() => { setEditConfig(null); resetForm(); }} title="Edit Proxy Config" description="Update proxy configuration.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Upstream URL</label>
            <input value={formUpstream} onChange={(e) => setFormUpstream(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formMethod} onChange={setFormMethod} label="Method" options={[{ value: "*", label: "All Methods" }, { value: "GET", label: "GET" }, { value: "POST", label: "POST" }, { value: "PUT", label: "PUT" }, { value: "DELETE", label: "DELETE" }]} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Rate Limit</label>
              <input type="number" value={formRateLimit} onChange={(e) => setFormRateLimit(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Timeout (ms)</label>
              <input type="number" value={formTimeout} onChange={(e) => setFormTimeout(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setEditConfig(null); resetForm(); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleEdit} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Save Changes</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteConfig} onClose={() => setDeleteConfig(null)} onConfirm={handleDelete} title="Delete Config" message={`Are you sure you want to delete "${deleteConfig?.name}"?`} confirmLabel="Delete" danger />
    </DashboardShell>
  );
}
