"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { ThumbsUp, ThumbsDown, Send, MessageSquare, Clock } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Feedback = { id: string; request_id: string; original_label: string; corrected_label: string; reason: string; created_at: string };
type FormData = { request_id: string; original_label: string; corrected_label: string; reason: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const labels = ["human", "bot", "suspicious", "unknown"];

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({ request_id: "", original_label: "bot", corrected_label: "human", reason: "" });

  const load = async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/feedback", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
    if (res.ok) {
      const body = await res.json();
      setFeedback(body.feedback || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const submit = async () => {
    if (!form.request_id.trim()) return toast("error", "Enter a request ID");
    if (!form.reason.trim()) return toast("error", "Provide a reason for the correction");
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (!res.ok) return toast("error", result.error || "Failed to submit feedback");
    toast("success", "Feedback submitted");
    setForm({ request_id: "", original_label: "bot", corrected_label: "human", reason: "" });
    await load();
    setSubmitting(false);
  };

  const stats = {
    total: feedback.length,
    botToHuman: feedback.filter((f) => f.original_label === "bot" && f.corrected_label === "human").length,
    humanToBot: feedback.filter((f) => f.original_label === "human" && f.corrected_label === "bot").length,
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Model improvement</p>
          <div className="mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Feedback</h1>
            <p className="mt-1 text-slate-400">Submit corrections to improve detection accuracy.</p>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5">
            <div className="h-1 w-10 rounded-full bg-blue-500" />
            <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Total feedback</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.total}</p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5">
            <div className="h-1 w-10 rounded-full bg-emerald-400" />
            <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">False positives</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.botToHuman}</p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }} className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5">
            <div className="h-1 w-10 rounded-full bg-amber-400" />
            <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">False negatives</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.humanToBot}</p>
          </motion.div>
        </div>

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Submit correction</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Request ID</label>
              <input value={form.request_id} onChange={(e) => setForm({ ...form, request_id: e.target.value })} placeholder="req_abc123" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Original label</label>
                <select value={form.original_label} onChange={(e) => setForm({ ...form, original_label: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
                  {labels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Corrected label</label>
                <select value={form.corrected_label} onChange={(e) => setForm({ ...form, corrected_label: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white">
                  {labels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Reason</label>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} placeholder="Why should this be reclassified?" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none" />
            </div>
          </div>
          <div className="mt-4">
            <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
              <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit feedback"}
            </button>
          </div>
        </motion.section>

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Feedback history</h2>
          {feedback.length === 0 ? (
            <div className="mt-8 rounded-xl border-2 border-dashed border-slate-800 py-12 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {feedback.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white">{f.request_id}</span>
                      <span className="text-slate-600">→</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${f.corrected_label === "human" ? "bg-emerald-500/10 text-emerald-400" : f.corrected_label === "bot" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {f.corrected_label === "human" ? <ThumbsUp className="h-2.5 w-2.5" /> : <ThumbsDown className="h-2.5 w-2.5" />}
                        {f.corrected_label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{f.reason}</p>
                  </div>
                  <span className="text-xs text-slate-500"><Clock className="mr-1 inline h-3 w-3" />{new Date(f.created_at).toLocaleDateString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </DashboardShell>
  );
}
