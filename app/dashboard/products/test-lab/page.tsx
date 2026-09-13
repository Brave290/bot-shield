"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { FlaskConical, Play, Target, Trophy, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

type TestProfile = {
  id: string;
  name: string;
  description: string;
  tests: number;
  lastRun: string;
  avgScore: number;
};

type TestResult = {
  id: string;
  profile: string;
  timestamp: string;
  score: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: string;
};

const mockProfiles: TestProfile[] = [
  { id: "p1", name: "Bot Detection Accuracy", description: "Validate detection of common bot patterns and fingerprints.", tests: 24, lastRun: "2026-09-12T14:00:00Z", avgScore: 92 },
  { id: "p2", name: "Rate Limiting", description: "Test rate limiter behavior under various traffic patterns.", tests: 12, lastRun: "2026-09-11T10:00:00Z", avgScore: 88 },
  { id: "p3", name: "API Security", description: "Validate API authentication, authorization, and input validation.", tests: 18, lastRun: "2026-09-10T16:00:00Z", avgScore: 95 },
  { id: "p4", name: "Performance Impact", description: "Measure latency overhead introduced by BotShield.", tests: 8, lastRun: "2026-09-09T12:00:00Z", avgScore: 78 },
];

const mockResults: TestResult[] = [
  { id: "r1", profile: "Bot Detection Accuracy", timestamp: "2026-09-12T14:00:00Z", score: 92, passed: 22, failed: 1, skipped: 1, duration: "45s" },
  { id: "r2", profile: "Rate Limiting", timestamp: "2026-09-11T10:00:00Z", score: 88, passed: 10, failed: 2, skipped: 0, duration: "30s" },
  { id: "r3", profile: "API Security", timestamp: "2026-09-10T16:00:00Z", score: 95, passed: 17, failed: 1, skipped: 0, duration: "1m 12s" },
  { id: "r4", profile: "Bot Detection Accuracy", timestamp: "2026-09-09T14:00:00Z", score: 89, passed: 21, failed: 2, skipped: 1, duration: "42s" },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function TestLabPage() {
  const [profiles] = useState<TestProfile[]>(mockProfiles);
  const [results] = useState<TestResult[]>(mockResults);
  const [running, setRunning] = useState<string | null>(null);

  const handleRun = (id: string) => {
    setRunning(id);
    setTimeout(() => setRunning(null), 3000);
  };

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Testing Environment</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Test Lab</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Test Lab</h1>
          <p className="mt-1 text-slate-400">Run automated tests against your BotShield configuration and measure effectiveness.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["Test Profiles", profiles.length, "blue"], ["Avg Score", `${Math.round(profiles.reduce((sum, p) => sum + p.avgScore, 0) / profiles.length)}%`, "emerald"], ["Total Tests", profiles.reduce((sum, p) => sum + p.tests, 0), "violet"], ["Last Run", "Today", "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* Test Profiles */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Test Profiles</h2>
          <p className="mt-1 text-sm text-slate-400">Select a profile to run automated security tests.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="rounded-xl bg-slate-950 p-5 transition hover:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <FlaskConical className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{profile.name}</p>
                      <p className="text-xs text-slate-500">{profile.tests} tests</p>
                    </div>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${profile.avgScore >= 90 ? "bg-green-500/10" : profile.avgScore >= 70 ? "bg-amber-500/10" : "bg-red-500/10"}`}>
                    <Trophy className={`h-5 w-5 ${profile.avgScore >= 90 ? "text-green-400" : profile.avgScore >= 70 ? "text-amber-400" : "text-red-400"}`} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400 line-clamp-2">{profile.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${profile.avgScore >= 90 ? "text-green-400" : profile.avgScore >= 70 ? "text-amber-400" : "text-red-400"}`}>{profile.avgScore}%</p>
                    <p className="text-[10px] text-slate-500">avg score</p>
                  </div>
                  <button onClick={() => handleRun(profile.id)} disabled={running === profile.id} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
                    {running === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {running === profile.id ? "Running..." : "Run Tests"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Recent Results */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Recent Results</h2>
          <div className="mt-4 space-y-3">
            {results.map((result) => (
              <div key={result.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${result.score >= 90 ? "bg-green-500/10" : result.score >= 70 ? "bg-amber-500/10" : "bg-red-500/10"}`}>
                    {result.score >= 90 ? <CheckCircle className="h-5 w-5 text-green-400" /> : result.score >= 70 ? <Target className="h-5 w-5 text-amber-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{result.profile}</p>
                    <p className="text-xs text-slate-500">{new Date(result.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className={`text-lg font-bold ${result.score >= 90 ? "text-green-400" : result.score >= 70 ? "text-amber-400" : "text-red-400"}`}>{result.score}%</p>
                    <p className="text-[10px] text-slate-500">score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-green-400">{result.passed}</p>
                    <p className="text-[10px] text-slate-500">passed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-red-400">{result.failed}</p>
                    <p className="text-[10px] text-slate-500">failed</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" /> {result.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
