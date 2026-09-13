"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Modal } from "@/components/ui/modal";
import { Select, Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { ThumbsUp, ThumbsDown, Send, MessageSquare, Clock, Plus, XCircle, Bug, Lightbulb, Sparkles } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Feedback = { id: string; type: string; message: string; page: string; created_at: string; user_id: string };
type FormData = { type: string; message: string; page: string };

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const typeOptions = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement" },
  { value: "other", label: "Other" },
];
const typeBadgeVariant: Record<string, "danger" | "info" | "warning" | "default"> = {
  bug: "danger",
  feature: "info",
  improvement: "warning",
  other: "default",
};
const typeIcon: Record<string, any> = {
  bug: Bug,
  feature: Lightbulb,
  improvement: Sparkles,
  other: MessageSquare,
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({ type: "bug", message: "", page: "" });

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/feedback", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
      if (res.ok) setFeedback(await res.json());
      else setError("Failed to load feedback");
    } catch { setError("Failed to load data"); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (!form.message.trim()) return toast("error", "Enter your feedback message");
    if (form.message.trim().length < 10) return toast("error", "Message must be at least 10 characters");
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, message: form.message, page: form.page || undefined }),
      });
      const result = await res.json();
      if (!res.ok) return toast("error", result.error || "Failed to submit feedback");
      toast("success", "Feedback submitted successfully");
      setForm({ type: "bug", message: "", page: "" });
      setShowSubmit(false);
      await load();
    } finally { setSubmitting(false); }
  };

  const stats = {
    total: feedback.length,
    bugs: feedback.filter((f) => f.type === "bug").length,
    features: feedback.filter((f) => f.type === "feature").length,
    improvements: feedback.filter((f) => f.type === "improvement").length,
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

  if (error) {
    return (
      <DashboardShell userType="user">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-lg font-semibold text-white">Failed to load feedback</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); void load(); }} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user" userPlan="Pro">
      <PlanGate feature="feedback" currentPlan="Pro">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Model improvement</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Feedback</h1>
                <p className="mt-1 text-slate-400">Submit corrections and suggestions to improve detection accuracy.</p>
              </div>
              <button onClick={() => setShowSubmit(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
                <Plus className="h-4 w-4" /> Submit Feedback
              </button>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total feedback" value={stats.total} color="bg-blue-500" />
            <StatCard label="Bug reports" value={stats.bugs} color="bg-red-500" />
            <StatCard label="Feature requests" value={stats.features} color="bg-violet-500" />
            <StatCard label="Improvements" value={stats.improvements} color="bg-amber-500" />
          </div>

          <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit feedback" description="Report a bug, request a feature, or suggest an improvement." size="lg">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={typeOptions} />
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Page (optional)</label>
                  <input value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} placeholder="/dashboard/analytics" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Message</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Describe the issue, feature, or improvement in detail..." className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none" />
                <p className="mt-1 text-xs text-slate-500">{form.message.length}/2048 characters (min 10)</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowSubmit(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={submit} disabled={submitting || form.message.trim().length < 10} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors">
                  <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit feedback"}
                </button>
              </div>
            </div>
          </Modal>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Feedback history</h2>
            {feedback.length === 0 ? (
              <EmptyState icon={<MessageSquare className="h-8 w-8 text-slate-600" />} title="No feedback yet" description="Submit your first piece of feedback to help improve BotShield." action={<button onClick={() => setShowSubmit(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition"><Plus className="h-4 w-4" /> Submit Feedback</button>} />
            ) : (
              <div className="mt-4 space-y-2">
                {feedback.map((f, i) => {
                  const Icon = typeIcon[f.type] || MessageSquare;
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={typeBadgeVariant[f.type] || "default"}>
                            <Icon className="h-3 w-3" />
                            {f.type}
                          </Badge>
                          {f.page && <span className="text-xs text-slate-500 font-mono">{f.page}</span>}
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{f.message}</p>
                      </div>
                      <span className="text-xs text-slate-500"><Clock className="mr-1 inline h-3 w-3" />{new Date(f.created_at).toLocaleDateString()}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>
        </div>
      </PlanGate>
    </DashboardShell>
  );
}
