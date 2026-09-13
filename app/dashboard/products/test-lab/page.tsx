"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { toast } from "@/components/toast";
import { motion } from "framer-motion";
import {
  FlaskConical, Plus, Trash2, Edit, Loader2, AlertTriangle,
  Play, CheckCircle, XCircle, Clock, BarChart3,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
};

type TestRun = {
  id: string;
  profile_id: string;
  status: string;
  config: Record<string, unknown>;
  score: number | null;
  results: unknown;
  started_at: string;
  completed_at: string | null;
};

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function TestLabPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [deleteProfile, setDeleteProfile] = useState<Profile | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/products/test-lab", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load test lab data");
      const data = await res.json();
      setProfiles(data.profiles || []);
      setRuns(data.runs || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setFormName(""); setFormDesc(""); };

  const handleCreate = async () => {
    if (!formName.trim()) { toast("error", "Profile name is required"); return; }
    const token = await getToken();
    const res = await fetch("/api/products/test-lab", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-profile", name: formName, description: formDesc }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to create profile"); return; }
    toast("success", "Profile created");
    setShowCreate(false);
    resetForm();
    load();
  };

  const handleEdit = async () => {
    if (!editProfile) return;
    const token = await getToken();
    const res = await fetch("/api/products/test-lab", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-profile", profile_id: editProfile.id, name: formName, description: formDesc }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to update"); return; }
    toast("success", "Profile updated");
    setEditProfile(null);
    resetForm();
    load();
  };

  const handleDelete = async () => {
    if (!deleteProfile) return;
    const token = await getToken();
    const res = await fetch("/api/products/test-lab", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-profile", profile_id: deleteProfile.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete profile"); return; }
    toast("success", "Profile deleted");
    setDeleteProfile(null);
    load();
  };

  const handleRunTest = async (profileId: string) => {
    setRunningId(profileId);
    const token = await getToken();
    const res = await fetch("/api/products/test-lab", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run-test", profile_id: profileId }),
    });
    const data = await res.json();
    setRunningId(null);
    if (!res.ok) { toast("error", data.error || "Failed to start test"); return; }
    toast("success", "Test started");
    load();
  };

  const openEdit = (p: Profile) => {
    setFormName(p.name);
    setFormDesc(p.description);
    setEditProfile(p);
  };

  const scoreColor = (s: number | null) => {
    if (s === null) return "text-slate-500";
    if (s >= 80) return "text-emerald-400";
    if (s >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const completedRuns = runs.filter((r) => r.status === "completed");
  const avgScore = completedRuns.length > 0 ? Math.round(completedRuns.reduce((s, r) => s + (r.score || 0), 0) / completedRuns.length) : 0;

  return (
    <DashboardShell userType="user">
      <PlanGate feature="test-lab" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Security Testing</p>
              <Badge variant="pro">BotShield Test Lab</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Test Lab</h1>
            <p className="mt-1 text-slate-400">Create test profiles, run security tests, and review results with scores.</p>
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
                <StatCard label="Profiles" value={profiles.length} color="bg-blue-500" />
                <StatCard label="Total Runs" value={runs.length} color="bg-violet-500" />
                <StatCard label="Completed" value={completedRuns.length} color="bg-emerald-500" />
                <StatCard label="Avg Score" value={avgScore} color="bg-amber-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Test Profiles</h2>
                    <p className="mt-1 text-sm text-slate-400">Create and manage test profiles for repeated security testing.</p>
                  </div>
                  <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> New Profile
                  </button>
                </div>
                {profiles.length === 0 ? (
                  <EmptyState icon={<FlaskConical className="h-8 w-8 text-slate-500" />} title="No test profiles" description="Create a profile to start running security tests." action={
                    <button onClick={() => { resetForm(); setShowCreate(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                      <Plus className="h-4 w-4" /> New Profile
                    </button>
                  } />
                ) : (
                  <div className="mt-4 space-y-3">
                    {profiles.map((profile) => {
                      const profileRuns = runs.filter((r) => r.profile_id === profile.id);
                      const lastRun = profileRuns[0];
                      return (
                        <div key={profile.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                              <FlaskConical className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{profile.name}</p>
                              <p className="text-xs text-slate-500">{profile.description || "No description"} &middot; {profileRuns.length} runs</p>
                              {lastRun && (
                                <p className="text-xs text-slate-600">Last: {new Date(lastRun.started_at).toLocaleDateString()} {lastRun.score !== null && <span className={scoreColor(lastRun.score)}>Score: {lastRun.score}</span>}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={profile.enabled ? "success" : "default"}>{profile.enabled ? "Enabled" : "Disabled"}</Badge>
                            <button onClick={() => handleRunTest(profile.id)} disabled={runningId === profile.id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white transition hover:bg-emerald-500 disabled:opacity-50">
                              {runningId === profile.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Run
                            </button>
                            <button onClick={() => openEdit(profile)} className="p-2 text-slate-400 hover:text-white transition"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setDeleteProfile(profile)} className="p-2 text-slate-400 hover:text-red-400 transition"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.section>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <h2 className="text-xl font-semibold text-white">Test Results</h2>
                {runs.length === 0 ? (
                  <EmptyState icon={<BarChart3 className="h-8 w-8 text-slate-500" />} title="No test runs" description="Run a test on a profile to see results here." />
                ) : (
                  <div className="mt-4 space-y-3">
                    {runs.slice(0, 15).map((run) => {
                      const profile = profiles.find((p) => p.id === run.profile_id);
                      return (
                        <div key={run.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${run.status === "completed" ? "bg-emerald-500/10" : run.status === "running" ? "bg-blue-500/10" : "bg-red-500/10"}`}>
                              {run.status === "completed" ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : run.status === "running" ? <Loader2 className="h-5 w-5 text-blue-400 animate-spin" /> : <XCircle className="h-5 w-5 text-red-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{profile?.name || "Unknown Profile"}</p>
                              <p className="text-xs text-slate-500">Started {new Date(run.started_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {run.score !== null && (
                              <span className={`text-2xl font-bold ${scoreColor(run.score)}`}>{run.score}</span>
                            )}
                            <Badge variant={run.status === "completed" ? "success" : run.status === "running" ? "info" : "danger"}>{run.status}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.section>
            </>
          )}
        </div>
      </PlanGate>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Test Profile" description="Set up a new test profile for security testing.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Profile Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="API Security Test" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe what this test profile covers..." rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreate} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Create Profile</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editProfile} onClose={() => { setEditProfile(null); resetForm(); }} title="Edit Profile" description="Update test profile details.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Profile Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setEditProfile(null); resetForm(); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleEdit} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Save Changes</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteProfile} onClose={() => setDeleteProfile(null)} onConfirm={handleDelete} title="Delete Profile" message={`Are you sure you want to delete "${deleteProfile?.name}"? This will also remove all test runs.`} confirmLabel="Delete" danger />
    </DashboardShell>
  );
}
