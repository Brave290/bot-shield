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
  ClipboardCheck, Plus, Trash2, Edit, Loader2, AlertTriangle,
  CheckCircle, XCircle, MinusCircle, FileText,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Report = {
  id: string;
  name: string;
  framework: string;
  status: string;
  summary: Record<string, unknown>;
  created_at: string;
};

type Control = {
  id: string;
  report_id: string;
  control_id: string;
  name: string;
  status: string;
  notes: string;
  updated_at: string;
};

const frameworks = ["SOC 2", "GDPR", "PCI DSS", "HIPAA", "ISO 27001", "NIST CSF"];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function CompliancePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);

  const [formName, setFormName] = useState("");
  const [formFramework, setFormFramework] = useState("SOC 2");

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/products/compliance", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load compliance data");
      const data = await res.json();
      setReports(data.reports || []);
      setControls(data.controls || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!formName.trim()) { toast("error", "Report name is required"); return; }
    const token = await getToken();
    const res = await fetch("/api/products/compliance", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-report", name: formName, framework: formFramework }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to create report"); return; }
    toast("success", "Report created");
    setShowCreate(false);
    setFormName("");
    setFormFramework("SOC 2");
    load();
  };

  const handleEdit = async () => {
    if (!editReport) return;
    const token = await getToken();
    const res = await fetch("/api/products/compliance", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-report", report_id: editReport.id, name: formName, framework: formFramework }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to update"); return; }
    toast("success", "Report updated");
    setEditReport(null);
    setFormName("");
    setFormFramework("SOC 2");
    load();
  };

  const handleDelete = async () => {
    if (!deleteReport) return;
    const token = await getToken();
    const res = await fetch("/api/products/compliance", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-report", report_id: deleteReport.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete report"); return; }
    toast("success", "Report deleted");
    setDeleteReport(null);
    load();
  };

  const openEdit = (r: Report) => {
    setFormName(r.name);
    setFormFramework(r.framework);
    setEditReport(r);
  };

  const controlStatusIcon = (s: string) => {
    if (s === "pass") return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    if (s === "fail") return <XCircle className="h-4 w-4 text-red-400" />;
    if (s === "partial") return <MinusCircle className="h-4 w-4 text-amber-400" />;
    return <span className="h-4 w-4 rounded-full border border-slate-600" />;
  };

  const frameworkColor = (f: string) => {
    if (f === "SOC 2") return "info";
    if (f === "GDPR") return "warning";
    if (f === "PCI DSS") return "danger";
    return "default";
  };

  const passCount = controls.filter((c) => c.status === "pass").length;
  const failCount = controls.filter((c) => c.status === "fail").length;

  return (
    <DashboardShell userType="user">
      <PlanGate feature="compliance" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Compliance & Auditing</p>
              <Badge variant="info">BotShield Compliance</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Compliance Center</h1>
            <p className="mt-1 text-slate-400">Generate compliance reports and track control status across frameworks.</p>
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
                <StatCard label="Reports" value={reports.length} color="bg-blue-500" />
                <StatCard label="Controls" value={controls.length} color="bg-violet-500" />
                <StatCard label="Passed" value={passCount} color="bg-emerald-500" />
                <StatCard label="Failed" value={failCount} color="bg-red-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Compliance Reports</h2>
                    <p className="mt-1 text-sm text-slate-400">Generate and manage compliance reports for various frameworks.</p>
                  </div>
                  <button onClick={() => { setFormName(""); setFormFramework("SOC 2"); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> New Report
                  </button>
                </div>
                {reports.length === 0 ? (
                  <EmptyState icon={<ClipboardCheck className="h-8 w-8 text-slate-500" />} title="No reports" description="Create a compliance report to start tracking your posture." action={
                    <button onClick={() => { setFormName(""); setFormFramework("SOC 2"); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                      <Plus className="h-4 w-4" /> New Report
                    </button>
                  } />
                ) : (
                  <div className="mt-4 space-y-3">
                    {reports.map((report) => {
                      const reportControls = controls.filter((c) => c.report_id === report.id);
                      const reportPass = reportControls.filter((c) => c.status === "pass").length;
                      return (
                        <div key={report.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                              <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{report.name}</p>
                              <p className="text-xs text-slate-500">{reportControls.length} controls &middot; {reportPass} passed &middot; Created {new Date(report.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={frameworkColor(report.framework) as any}>{report.framework}</Badge>
                            <Badge variant={report.status === "completed" ? "success" : "default"}>{report.status}</Badge>
                            <button onClick={() => openEdit(report)} className="p-2 text-slate-400 hover:text-white transition"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setDeleteReport(report)} className="p-2 text-slate-400 hover:text-red-400 transition"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.section>

              {controls.length > 0 && (
                <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                  <h2 className="text-xl font-semibold text-white">Control Status</h2>
                  <div className="mt-4 space-y-2">
                    {controls.slice(0, 20).map((control) => (
                      <div key={control.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-950 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {controlStatusIcon(control.status)}
                          <div>
                            <p className="text-sm text-white">{control.name || control.control_id}</p>
                            {control.notes && <p className="text-xs text-slate-500">{control.notes}</p>}
                          </div>
                        </div>
                        <Badge variant={control.status === "pass" ? "success" : control.status === "fail" ? "danger" : control.status === "partial" ? "warning" : "default"}>{control.status}</Badge>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </>
          )}
        </div>
      </PlanGate>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Compliance Report" description="Generate a new compliance report for a framework.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Report Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Q3 2026 Audit" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formFramework} onChange={setFormFramework} label="Framework" options={frameworks.map((f) => ({ value: f, label: f }))} />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Create Report</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editReport} onClose={() => { setEditReport(null); setFormName(""); setFormFramework("SOC 2"); }} title="Edit Report" description="Update report details.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Report Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <Select value={formFramework} onChange={setFormFramework} label="Framework" options={frameworks.map((f) => ({ value: f, label: f }))} />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setEditReport(null); setFormName(""); setFormFramework("SOC 2"); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleEdit} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Save Changes</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteReport} onClose={() => setDeleteReport(null)} onConfirm={handleDelete} title="Delete Report" message={`Are you sure you want to delete "${deleteReport?.name}"? This will also remove all associated controls.`} confirmLabel="Delete" danger />
    </DashboardShell>
  );
}
