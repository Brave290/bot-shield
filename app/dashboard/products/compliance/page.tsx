"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { ClipboardCheck, FileText, CheckCircle, Circle, AlertTriangle, Download, ArrowRight } from "lucide-react";

type Framework = {
  id: string;
  name: string;
  description: string;
  version: string;
  controls: number;
  implemented: number;
  lastAudit: string;
  status: "compliant" | "partial" | "non-compliant";
};

type Control = {
  id: string;
  framework: string;
  code: string;
  name: string;
  status: "implemented" | "partial" | "not-implemented";
  description: string;
};

const mockFrameworks: Framework[] = [
  { id: "f1", name: "SOC 2 Type II", description: "Trust Services Criteria for security, availability, and confidentiality.", version: "2024", controls: 42, implemented: 38, lastAudit: "2026-08-15T00:00:00Z", status: "compliant" },
  { id: "f2", name: "GDPR", description: "EU General Data Protection Regulation compliance.", version: "2024", controls: 28, implemented: 22, lastAudit: "2026-07-01T00:00:00Z", status: "partial" },
  { id: "f3", name: "PCI DSS", description: "Payment Card Industry Data Security Standard.", version: "4.0", controls: 36, implemented: 36, lastAudit: "2026-06-01T00:00:00Z", status: "compliant" },
  { id: "f4", name: "HIPAA", description: "Health Insurance Portability and Accountability Act.", version: "2024", controls: 18, implemented: 10, lastAudit: "2026-05-01T00:00:00Z", status: "non-compliant" },
];

const mockControls: Control[] = [
  { id: "c1", framework: "SOC 2", code: "CC6.1", name: "Logical Access Controls", status: "implemented", description: "Implement logical access security over protected information assets." },
  { id: "c2", framework: "SOC 2", code: "CC7.1", name: "System Monitoring", status: "implemented", description: "Monitor system components and the operation of controls." },
  { id: "c3", framework: "SOC 2", code: "CC8.1", name: "Change Management", status: "partial", description: "Manage changes to infrastructure, data, software, and procedures." },
  { id: "c4", framework: "GDPR", code: "Art. 17", name: "Right to Erasure", status: "implemented", description: "Implement mechanisms for data subject deletion requests." },
  { id: "c5", framework: "GDPR", code: "Art. 20", name: "Data Portability", status: "not-implemented", description: "Enable data export in machine-readable format." },
  { id: "c6", framework: "PCI DSS", code: "Req. 1", name: "Firewall Configuration", status: "implemented", description: "Install and maintain network security controls." },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function CompliancePage() {
  const [frameworks] = useState<Framework[]>(mockFrameworks);
  const [controls] = useState<Control[]>(mockControls);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  const filteredControls = selectedFramework ? controls.filter((c) => c.framework === selectedFramework) : controls;

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Compliance Management</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BotShield Compliance</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Compliance Center</h1>
          <p className="mt-1 text-slate-400">Track compliance across security frameworks and generate audit reports.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["Frameworks", frameworks.length, "blue"], ["Total Controls", frameworks.reduce((sum, f) => sum + f.controls, 0), "violet"], ["Implemented", frameworks.reduce((sum, f) => sum + f.implemented, 0), "emerald"], ["Compliance Rate", `${Math.round((frameworks.reduce((sum, f) => sum + f.implemented, 0) / frameworks.reduce((sum, f) => sum + f.controls, 0)) * 100)}%`, "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* Frameworks */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Compliance Frameworks</h2>
          <div className="mt-4 space-y-3">
            {frameworks.map((fw) => (
              <div key={fw.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <ClipboardCheck className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{fw.name}</p>
                    <p className="text-xs text-slate-500">v{fw.version} &middot; {fw.controls} controls</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{fw.implemented}/{fw.controls}</span>
                      <span className="text-slate-500">{Math.round((fw.implemented / fw.controls) * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${fw.status === "compliant" ? "bg-green-500" : fw.status === "partial" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${(fw.implemented / fw.controls) * 100}%` }} />
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${fw.status === "compliant" ? "bg-green-500/10 text-green-400" : fw.status === "partial" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>{fw.status}</span>
                  <button onClick={() => setSelectedFramework(selectedFramework === fw.name ? null : fw.name)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-blue-500/50 hover:text-white">
                    View <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Controls */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Control Status</h2>
            {selectedFramework && (
              <button onClick={() => setSelectedFramework(null)} className="text-xs text-blue-400 hover:text-blue-300">Clear filter</button>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {filteredControls.map((control) => (
              <div key={control.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  {control.status === "implemented" ? <CheckCircle className="h-5 w-5 text-green-400" /> : control.status === "partial" ? <AlertTriangle className="h-5 w-5 text-amber-400" /> : <Circle className="h-5 w-5 text-red-400" />}
                  <div>
                    <p className="text-sm font-medium text-white">{control.code} - {control.name}</p>
                    <p className="text-xs text-slate-500">{control.description}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${control.status === "implemented" ? "bg-green-500/10 text-green-400" : control.status === "partial" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>{control.status.replace("-", " ")}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Generate Report */}
        <motion.section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Generate Compliance Report</h2>
              <p className="mt-1 text-sm text-slate-400">Create a detailed report for auditors and stakeholders.</p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                <FileText className="h-4 w-4" /> Generate PDF
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-blue-500/50 hover:text-white">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
