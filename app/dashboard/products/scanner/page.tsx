"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { Scan, Shield, AlertTriangle, Plus, ArrowRight, CheckCircle, XCircle, Loader2 } from "lucide-react";

type Target = {
  id: string;
  url: string;
  status: "active" | "pending" | "failed";
  lastScan: string;
  findings: { critical: number; warning: number; info: number };
};

type ScanResult = {
  id: string;
  target: string;
  timestamp: string;
  score: number;
  findings: { severity: string; title: string; description: string }[];
};

const mockTargets: Target[] = [
  { id: "1", url: "example.com", status: "active", lastScan: "2026-09-12T10:30:00Z", findings: { critical: 2, warning: 5, info: 12 } },
  { id: "2", url: "api.example.com", status: "active", lastScan: "2026-09-11T14:00:00Z", findings: { critical: 0, warning: 3, info: 8 } },
  { id: "3", url: "staging.example.com", status: "pending", lastScan: "2026-09-10T09:15:00Z", findings: { critical: 0, warning: 1, info: 4 } },
];

const mockScanResults: ScanResult[] = [
  {
    id: "s1",
    target: "example.com",
    timestamp: "2026-09-12T10:30:00Z",
    score: 72,
    findings: [
      { severity: "critical", title: "Exposed admin panel", description: "Found accessible /admin route without IP restriction." },
      { severity: "warning", title: "Rate limiting absent", description: "No rate limiting detected on login endpoint." },
      { severity: "info", title: "CORS headers wide", description: "Access-Control-Allow-Origin set to *." },
    ],
  },
  {
    id: "s2",
    target: "api.example.com",
    timestamp: "2026-09-11T14:00:00Z",
    score: 91,
    findings: [
      { severity: "warning", title: "Missing CSP header", description: "No Content-Security-Policy detected." },
    ],
  },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function ScannerPage() {
  const [targets, setTargets] = useState<Target[]>(mockTargets);
  const [scanResults, setScanResults] = useState<ScanResult[]>(mockScanResults);
  const [newUrl, setNewUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const handleAddTarget = () => {
    if (!newUrl.trim()) return;
    const target: Target = {
      id: String(Date.now()),
      url: newUrl,
      status: "pending",
      lastScan: new Date().toISOString(),
      findings: { critical: 0, warning: 0, info: 0 },
    };
    setTargets([target, ...targets]);
    setNewUrl("");
  };

  const handleScan = (id: string) => {
    setScanning(true);
    setTimeout(() => {
      const result: ScanResult = {
        id: `s${Date.now()}`,
        target: targets.find((t) => t.id === id)?.url || "",
        timestamp: new Date().toISOString(),
        score: Math.floor(Math.random() * 40) + 60,
        findings: [
          { severity: "warning", title: "New issue detected", description: "Automated scan found potential vulnerability." },
        ],
      };
      setScanResults([result, ...scanResults]);
      setScanning(false);
    }, 2000);
  };

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Security Scanner</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BotShield Scanner</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Vulnerability Scanner</h1>
          <p className="mt-1 text-slate-400">Scan your targets for security vulnerabilities and configuration issues.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["Total Targets", targets.length, "blue"], ["Active", targets.filter((t) => t.status === "active").length, "emerald"], ["Critical Findings", targets.reduce((sum, t) => sum + t.findings.critical, 0), "red"], ["Warnings", targets.reduce((sum, t) => sum + t.findings.warning, 0), "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* Add Target Form */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Add Target</h2>
          <p className="mt-1 text-sm text-slate-400">Enter a domain or URL to scan for vulnerabilities.</p>
          <div className="mt-4 flex gap-2">
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <button onClick={handleAddTarget} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
              <Plus className="h-4 w-4" /> Add Target
            </button>
          </div>
        </motion.section>

        {/* Targets List */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Targets</h2>
          <div className="mt-4 space-y-3">
            {targets.map((target) => (
              <div key={target.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Scan className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{target.url}</p>
                    <p className="text-xs text-slate-500">Last scan: {new Date(target.lastScan).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs"><AlertTriangle className="h-3 w-3 text-red-400" />{target.findings.critical}</span>
                  <span className="flex items-center gap-1.5 text-xs"><AlertTriangle className="h-3 w-3 text-amber-400" />{target.findings.warning}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${target.status === "active" ? "bg-green-500/10 text-green-400" : target.status === "pending" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>{target.status}</span>
                  <button onClick={() => handleScan(target.id)} disabled={scanning} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs text-white transition hover:bg-blue-500 disabled:opacity-50">
                    {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Scan className="h-3 w-3" />} Scan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Scan Results */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Recent Scan Results</h2>
          <div className="mt-4 space-y-3">
            {scanResults.map((result) => (
              <div key={result.id} className="rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${result.score >= 80 ? "bg-green-500/10" : result.score >= 60 ? "bg-amber-500/10" : "bg-red-500/10"}`}>
                      {result.score >= 80 ? <CheckCircle className="h-5 w-5 text-green-400" /> : result.score >= 60 ? <AlertTriangle className="h-5 w-5 text-amber-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{result.target}</p>
                      <p className="text-xs text-slate-500">{new Date(result.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${result.score >= 80 ? "text-green-400" : result.score >= 60 ? "text-amber-400" : "text-red-400"}`}>{result.score}</span>
                    <button onClick={() => setSelectedResult(selectedResult === result.id ? null : result.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-blue-500/50 hover:text-white">
                      Details <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {selectedResult === result.id && (
                  <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
                    {result.findings.map((finding, i) => (
                      <div key={i} className={`rounded-lg p-3 ${finding.severity === "critical" ? "border border-red-500/20 bg-red-500/5" : finding.severity === "warning" ? "border border-amber-500/20 bg-amber-500/5" : "border border-slate-700 bg-slate-900"}`}>
                        <p className={`text-sm font-medium ${finding.severity === "critical" ? "text-red-400" : finding.severity === "warning" ? "text-amber-400" : "text-slate-300"}`}>{finding.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{finding.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
