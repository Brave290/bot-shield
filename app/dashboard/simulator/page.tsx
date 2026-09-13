"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

export default function RulesSimulator() {
  const [mouseTime, setMouseTime] = useState(4200);
  const [curves, setCurves] = useState(14);
  const [typingTime, setTypingTime] = useState(9000);
  const [fingerprint, setFingerprint] = useState(true);
  const result = useMemo(() => {
    let score = 50;
    const reasons: string[] = [];
    if (mouseTime < 250) { score += 25; reasons.push("automation_pattern"); }
    if (curves === 0) { score += 20; reasons.push("no_pointer_curves"); }
    if (typingTime < 1000) { score += 15; reasons.push("rapid_typing"); }
    if (!fingerprint) { score += 10; reasons.push("missing_fingerprint"); }
    score = Math.min(100, score);
    return { score, status: score >= 70 ? "blocked" : "passed", reasons: reasons.length ? reasons : ["normal_behavior"] };
  }, [mouseTime, curves, typingTime, fingerprint]);

  return (
    <DashboardShell userType="user">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Policy testing</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Rules Simulator</h1>
          <p className="mt-2 text-slate-400">Preview how behavioral inputs map to a decision before changing live traffic.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Request signals</h2>
            <div className="mt-5 space-y-5">
              <label className="block text-sm text-slate-300">
                Mouse time (ms)
                <input type="range" min="40" max="10000" value={mouseTime} onChange={(e) => setMouseTime(Number(e.target.value))} className="mt-2 w-full accent-blue-500" />
                <output className="text-xs text-blue-300">{mouseTime}</output>
              </label>
              <label className="block text-sm text-slate-300">
                Pointer curves
                <input type="range" min="0" max="50" value={curves} onChange={(e) => setCurves(Number(e.target.value))} className="mt-2 w-full accent-blue-500" />
                <output className="text-xs text-blue-300">{curves}</output>
              </label>
              <label className="block text-sm text-slate-300">
                Typing time (ms)
                <input type="range" min="100" max="20000" value={typingTime} onChange={(e) => setTypingTime(Number(e.target.value))} className="mt-2 w-full accent-blue-500" />
                <output className="text-xs text-blue-300">{typingTime}</output>
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" checked={fingerprint} onChange={(e) => setFingerprint(e.target.checked)} className="h-4 w-4 accent-blue-500" />
                Fingerprint present
              </label>
            </div>
          </section>

          <section className={`rounded-2xl border p-6 ${result.status === "blocked" ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Simulated decision</p>
            <p className={`mt-4 text-4xl font-bold ${result.status === "blocked" ? "text-red-400" : "text-emerald-400"}`}>
              {result.status === "blocked" ? "BLOCKED" : "PASSED"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Score: <span className={`font-mono font-bold ${result.score >= 70 ? "text-red-400" : "text-emerald-400"}`}>{result.score}</span> / 100
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.reasons.map((r) => (
                <span key={r} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{r.replace(/_/g, " ")}</span>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">Threshold: 70 (configurable in project settings). This is a local estimate — the real engine weights more signals.</p>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">How the scoring works</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-400">
            <div className="space-y-2">
              <p><span className="text-blue-400 font-medium">Pointer kinematics:</span> Mouse movement distance, time, and curve count indicate human-like interaction patterns.</p>
              <p><span className="text-blue-400 font-medium">Keystroke dynamics:</span> Typing speed, backspace frequency, and character count reveal input automation.</p>
            </div>
            <div className="space-y-2">
              <p><span className="text-blue-400 font-medium">Device signals:</span> Webdriver flag, hardware concurrency, and fingerprint presence are strong automation indicators.</p>
              <p><span className="text-blue-400 font-medium">Network hints:</span> Connection type and data-saving mode provide additional context for risk assessment.</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
