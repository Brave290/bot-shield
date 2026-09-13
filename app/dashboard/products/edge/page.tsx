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
  Cloud, Plus, Trash2, Edit, Loader2, AlertTriangle, Activity,
  ToggleLeft, ToggleRight,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Deployment = {
  id: string;
  name: string;
  region: string;
  config: Record<string, unknown>;
  status: string;
  created_at: string;
};

type EdgeLog = {
  id: string;
  deployment_name: string;
  event: string;
  details: string;
  created_at: string;
};

const regions = ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function EdgePage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [logs, setLogs] = useState<EdgeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editDeployment, setEditDeployment] = useState<Deployment | null>(null);
  const [deleteDeployment, setDeleteDeployment] = useState<Deployment | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formRegion, setFormRegion] = useState("us-east-1");

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/products/edge", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load edge data");
      const data = await res.json();
      setDeployments(data.deployments || []);
      setLogs(data.logs || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setFormName(""); setFormRegion("us-east-1"); };

  const handleCreate = async () => {
    if (!formName.trim()) { toast("error", "Name is required"); return; }
    const token = await getToken();
    const res = await fetch("/api/products/edge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-deployment", name: formName, region: formRegion }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to create deployment"); return; }
    toast("success", "Deployment created");
    setShowCreate(false);
    resetForm();
    load();
  };

  const handleEdit = async () => {
    if (!editDeployment) return;
    const token = await getToken();
    const res = await fetch("/api/products/edge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-deployment", deployment_id: editDeployment.id, name: formName, region: formRegion }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to update"); return; }
    toast("success", "Deployment updated");
    setEditDeployment(null);
    resetForm();
    load();
  };

  const handleDelete = async () => {
    if (!deleteDeployment) return;
    const token = await getToken();
    const res = await fetch("/api/products/edge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-deployment", deployment_id: deleteDeployment.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete deployment"); return; }
    toast("success", "Deployment deleted");
    setDeleteDeployment(null);
    load();
  };

  const handleToggle = async (dep: Deployment) => {
    setTogglingId(dep.id);
    const token = await getToken();
    const res = await fetch("/api/products/edge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-deployment", deployment_id: dep.id }),
    });
    setTogglingId(null);
    if (!res.ok) { toast("error", "Failed to toggle deployment"); return; }
    load();
  };

  const openEdit = (d: Deployment) => {
    setFormName(d.name);
    setFormRegion(d.region);
    setEditDeployment(d);
  };

  const statusVariant = (s: string) => {
    if (s === "active") return "success";
    if (s === "provisioning") return "info";
    if (s === "error") return "danger";
    return "default";
  };

  const activeCount = deployments.filter((d) => d.status === "active").length;

  return (
    <DashboardShell userType="user">
      <PlanGate feature="edge" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Edge Computing</p>
              <Badge variant="pro">BotShield Edge</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Edge Deployments</h1>
            <p className="mt-1 text-slate-400">Deploy BotShield to edge locations for ultra-low latency protection.</p>
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
                <StatCard label="Deployments" value={deployments.length} color="bg-blue-500" />
                <StatCard label="Active" value={activeCount} color="bg-emerald-500" />
                <StatCard label="Regions" value={new Set(deployments.map((d) => d.region)).size} color="bg-violet-500" />
                <StatCard label="Logs" value={logs.length} color="bg-amber-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Deployments</h2>
                    <p className="mt-1 text-sm text-slate-400">Manage your edge deployments and regions.</p>
                  </div>
                  <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> New Deployment
                  </button>
                </div>
                {deployments.length === 0 ? (
                  <EmptyState icon={<Cloud className="h-8 w-8 text-slate-500" />} title="No deployments" description="Create an edge deployment to get started." action={
                    <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                      <Plus className="h-4 w-4" /> New Deployment
                    </button>
                  } />
                ) : (
                  <div className="mt-4 space-y-3">
                    {deployments.map((dep) => (
                      <div key={dep.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <Cloud className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{dep.name}</p>
                            <p className="font-mono text-xs text-slate-500">{dep.region}</p>
                            <p className="text-xs text-slate-600">Created {new Date(dep.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={statusVariant(dep.status) as any}>{dep.status}</Badge>
                          <button onClick={() => handleToggle(dep)} disabled={togglingId === dep.id} className="text-slate-400 transition hover:text-white disabled:opacity-50">
                            {togglingId === dep.id ? <Loader2 className="h-6 w-6 animate-spin" /> : dep.status === "active" ? <ToggleRight className="h-6 w-6 text-green-400" /> : <ToggleLeft className="h-6 w-6" />}
                          </button>
                          <button onClick={() => openEdit(dep)} className="p-2 text-slate-400 hover:text-white transition"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteDeployment(dep)} className="p-2 text-slate-400 hover:text-red-400 transition"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <h2 className="text-xl font-semibold text-white">Edge Logs</h2>
                {logs.length === 0 ? (
                  <EmptyState icon={<Activity className="h-8 w-8 text-slate-500" />} title="No logs yet" description="Edge logs will appear here once deployments are active." />
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-3 font-medium">Deployment</th>
                          <th className="pb-3 font-medium">Event</th>
                          <th className="pb-3 font-medium">Details</th>
                          <th className="pb-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {logs.slice(0, 20).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/50">
                            <td className="py-3 text-white">{log.deployment_name}</td>
                            <td className="py-3"><Badge variant="info">{log.event}</Badge></td>
                            <td className="py-3 text-slate-400 max-w-[300px] truncate">{log.details}</td>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Edge Deployment" description="Deploy BotShield to an edge location.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My Edge Deployment" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formRegion} onChange={setFormRegion} label="Region" options={regions.map((r) => ({ value: r, label: r }))} />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Create Deployment</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editDeployment} onClose={() => { setEditDeployment(null); resetForm(); }} title="Edit Deployment" description="Update deployment settings.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formRegion} onChange={setFormRegion} label="Region" options={regions.map((r) => ({ value: r, label: r }))} />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setEditDeployment(null); resetForm(); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleEdit} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Save Changes</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteDeployment} onClose={() => setDeleteDeployment(null)} onConfirm={handleDelete} title="Delete Deployment" message={`Are you sure you want to delete "${deleteDeployment?.name}"?`} confirmLabel="Delete" danger />
    </DashboardShell>
  );
}
