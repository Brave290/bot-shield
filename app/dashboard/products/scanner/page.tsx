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
  Scan, Shield, AlertTriangle, Plus, ArrowRight, CheckCircle,
  XCircle, Loader2, Trash2, Edit, RefreshCw, Globe,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Target = {
  id: string;
  name: string;
  url: string;
  scan_type: string;
  status: string;
  last_scan_at: string | null;
  created_at: string;
};

type ScanResult = {
  id: string;
  target_id: string;
  scan_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  findings: { severity: string; title: string; description: string }[] | null;
};

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function ScannerPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Target | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Target | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formScanType, setFormScanType] = useState("quick");

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const [targetsRes, resultsRes] = await Promise.all([
        fetch("/api/products/scanner", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/products/scanner/results", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!targetsRes.ok) throw new Error("Failed to load targets");
      const targetsData = await targetsRes.json();
      setTargets(Array.isArray(targetsData) ? targetsData : []);
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setResults(Array.isArray(resultsData) ? resultsData : []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setFormName(""); setFormUrl(""); setFormScanType("quick"); };

  const handleCreate = async () => {
    if (!formUrl.trim()) { toast("error", "URL is required"); return; }
    const token = await getToken();
    const res = await fetch("/api/products/scanner", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-target", name: formName, url: formUrl, scan_type: formScanType }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to create target"); return; }
    toast("success", "Target created");
    setShowCreate(false);
    resetForm();
    load();
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const token = await getToken();
    const res = await fetch("/api/products/scanner", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-target", target_id: editTarget.id, name: formName, url: formUrl, scan_type: formScanType }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to update"); return; }
    toast("success", "Target updated");
    setEditTarget(null);
    resetForm();
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = await getToken();
    const res = await fetch("/api/products/scanner", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-target", target_id: deleteTarget.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete target"); return; }
    toast("success", "Target deleted");
    setDeleteTarget(null);
    load();
  };

  const handleScan = async (targetId: string) => {
    setScanningId(targetId);
    const token = await getToken();
    const res = await fetch("/api/products/scanner", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run-scan", target_id: targetId }),
    });
    const data = await res.json();
    setScanningId(null);
    if (!res.ok) { toast("error", data.error || "Failed to start scan"); return; }
    toast("success", "Scan started");
    load();
  };

  const openEdit = (t: Target) => {
    setFormName(t.name);
    setFormUrl(t.url);
    setFormScanType(t.scan_type);
    setEditTarget(t);
  };

  const statusColor = (s: string) => {
    if (s === "active" || s === "completed") return "success";
    if (s === "scanning" || s === "running") return "info";
    if (s === "error" || s === "failed") return "danger";
    return "warning";
  };

  const totalFindings = targets.reduce((sum, t) => {
    const r = results.find((res) => res.target_id === t.id);
    if (!r?.findings) return sum;
    return sum + r.findings.length;
  }, 0);

  return (
    <DashboardShell userType="user">
      <PlanGate feature="scanner" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Security Scanner</p>
              <Badge variant="info">BotShield Scanner</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Vulnerability Scanner</h1>
            <p className="mt-1 text-slate-400">Scan your targets for security vulnerabilities and configuration issues.</p>
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
                <StatCard label="Total Targets" value={targets.length} color="bg-blue-500" />
                <StatCard label="Scanning" value={targets.filter((t) => t.status === "scanning").length} color="bg-violet-500" />
                <StatCard label="Results" value={results.length} color="bg-emerald-500" />
                <StatCard label="Findings" value={totalFindings} color="bg-amber-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Targets</h2>
                    <p className="mt-1 text-sm text-slate-400">Manage scan targets and run vulnerability assessments.</p>
                  </div>
                  <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> Add Target
                  </button>
                </div>
                {targets.length === 0 ? (
                  <EmptyState icon={<Scan className="h-8 w-8 text-slate-500" />} title="No targets" description="Add a URL to start scanning for vulnerabilities." action={
                    <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                      <Plus className="h-4 w-4" /> Add Target
                    </button>
                  } />
                ) : (
                  <div className="mt-4 space-y-3">
                    {targets.map((target) => (
                      <div key={target.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <Globe className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{target.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{target.url}</p>
                            <p className="text-xs text-slate-600">{target.scan_type} scan &middot; {target.last_scan_at ? new Date(target.last_scan_at).toLocaleDateString() : "Never scanned"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={statusColor(target.status) as any}>{target.status}</Badge>
                          <button onClick={() => handleScan(target.id)} disabled={scanningId === target.id} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs text-white transition hover:bg-blue-500 disabled:opacity-50">
                            {scanningId === target.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scan className="h-3 w-3" />} Scan
                          </button>
                          <button onClick={() => openEdit(target)} className="p-2 text-slate-400 hover:text-white transition"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteTarget(target)} className="p-2 text-slate-400 hover:text-red-400 transition"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <h2 className="text-xl font-semibold text-white">Recent Results</h2>
                {results.length === 0 ? (
                  <EmptyState icon={<CheckCircle className="h-8 w-8 text-slate-500" />} title="No scan results" description="Run a scan on a target to see results here." />
                ) : (
                  <div className="mt-4 space-y-3">
                    {results.slice(0, 10).map((result) => (
                      <div key={result.id} className="rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${result.status === "completed" ? "bg-emerald-500/10" : result.status === "running" ? "bg-blue-500/10" : "bg-red-500/10"}`}>
                              {result.status === "completed" ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : result.status === "running" ? <Loader2 className="h-5 w-5 text-blue-400 animate-spin" /> : <XCircle className="h-5 w-5 text-red-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{result.scan_type} scan</p>
                              <p className="text-xs text-slate-500">{new Date(result.started_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={statusColor(result.status) as any}>{result.status}</Badge>
                            {result.findings && result.findings.length > 0 && (
                              <button onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-blue-500/50 hover:text-white">
                                {result.findings.length} findings <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        {expandedResult === result.id && result.findings && (
                          <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
                            {result.findings.map((f, i) => (
                              <div key={i} className={`rounded-lg p-3 ${f.severity === "critical" ? "border border-red-500/20 bg-red-500/5" : f.severity === "warning" ? "border border-amber-500/20 bg-amber-500/5" : "border border-slate-700 bg-slate-900"}`}>
                                <p className={`text-sm font-medium ${f.severity === "critical" ? "text-red-400" : f.severity === "warning" ? "text-amber-400" : "text-slate-300"}`}>{f.title}</p>
                                <p className="mt-1 text-xs text-slate-400">{f.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            </>
          )}
        </div>
      </PlanGate>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Scan Target" description="Enter a URL to scan for vulnerabilities.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My Website" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">URL</label>
            <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formScanType} onChange={setFormScanType} label="Scan Type" options={[{ value: "quick", label: "Quick Scan" }, { value: "full", label: "Full Scan" }, { value: "ssl", label: "SSL Check" }, { value: "headers", label: "Headers Check" }]} />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Create Target</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editTarget} onClose={() => { setEditTarget(null); resetForm(); }} title="Edit Target" description="Update target configuration.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">URL</label>
            <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formScanType} onChange={setFormScanType} label="Scan Type" options={[{ value: "quick", label: "Quick Scan" }, { value: "full", label: "Full Scan" }, { value: "ssl", label: "SSL Check" }, { value: "headers", label: "Headers Check" }]} />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setEditTarget(null); resetForm(); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleEdit} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Save Changes</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Target" message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all scan results.`} confirmLabel="Delete" danger />
    </DashboardShell>
  );
}
