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
  Users, Shield, Key, Loader2, AlertTriangle, Globe,
  Monitor, Smartphone, Tablet, Trash2, Plus,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Session = {
  id: string;
  session_token: string;
  device_info: Record<string, unknown>;
  ip_hash: string;
  country: string;
  status: string;
  expires_at: string;
  created_at: string;
};

type AuthMethod = {
  id: string;
  method: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
};

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function IdentityPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [methods, setMethods] = useState<AuthMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [revokeSession, setRevokeSession] = useState<Session | null>(null);
  const [deleteMethod, setDeleteMethod] = useState<AuthMethod | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("password");

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/products/identity", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load identity data");
      const data = await res.json();
      setSessions(data.sessions || []);
      setMethods(data.methods || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const handleAddMethod = async () => {
    const token = await getToken();
    const res = await fetch("/api/products/identity", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-auth-method", method: selectedMethod }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to add method"); return; }
    toast("success", "Auth method added");
    setShowAddMethod(false);
    load();
  };

  const handleToggleMethod = async (method: AuthMethod) => {
    const token = await getToken();
    const res = await fetch("/api/products/identity", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-auth-method", method_id: method.id }),
    });
    if (!res.ok) { toast("error", "Failed to toggle method"); return; }
    load();
  };

  const handleRevokeSession = async () => {
    if (!revokeSession) return;
    const token = await getToken();
    const res = await fetch("/api/products/identity", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke-session", session_id: revokeSession.id }),
    });
    if (!res.ok) { toast("error", "Failed to revoke session"); return; }
    toast("success", "Session revoked");
    setRevokeSession(null);
    load();
  };

  const handleDeleteMethod = async () => {
    if (!deleteMethod) return;
    const token = await getToken();
    const res = await fetch("/api/products/identity", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-auth-method", method_id: deleteMethod.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete method"); return; }
    toast("success", "Method deleted");
    setDeleteMethod(null);
    load();
  };

  const deviceIcon = (info: Record<string, unknown>) => {
    const ua = String(info.userAgent || "").toLowerCase();
    if (ua.includes("mobile") || ua.includes("android")) return <Smartphone className="h-4 w-4" />;
    if (ua.includes("tablet") || ua.includes("ipad")) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const methodIcon = (m: string) => {
    if (m === "totp") return "🔐";
    if (m === "passkey") return "🔑";
    if (m === "email_otp") return "📧";
    if (m === "sms_otp") return "📱";
    return "🔒";
  };

  const activeSessions = sessions.filter((s) => s.status === "active");

  return (
    <DashboardShell userType="user">
      <PlanGate feature="identity" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Identity & Access</p>
              <Badge variant="info">BotShield Identity</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Identity Management</h1>
            <p className="mt-1 text-slate-400">Manage active sessions, authentication methods, and security settings.</p>
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
                <StatCard label="Active Sessions" value={activeSessions.length} color="bg-blue-500" />
                <StatCard label="Total Sessions" value={sessions.length} color="bg-violet-500" />
                <StatCard label="Auth Methods" value={methods.length} color="bg-emerald-500" />
                <StatCard label="Enabled Methods" value={methods.filter((m) => m.enabled).length} color="bg-amber-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <h2 className="text-xl font-semibold text-white">Active Sessions</h2>
                <p className="mt-1 text-sm text-slate-400">Monitor and revoke active user sessions.</p>
                {sessions.length === 0 ? (
                  <EmptyState icon={<Users className="h-8 w-8 text-slate-500" />} title="No sessions" description="Active sessions will appear here." />
                ) : (
                  <div className="mt-4 space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            {deviceIcon(session.device_info)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{String(session.device_info?.browser || "Unknown Browser")} on {String(session.device_info?.os || "Unknown OS")}</p>
                            <p className="text-xs text-slate-500">{session.country || "Unknown"} &middot; Created {new Date(session.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={session.status === "active" ? "success" : session.status === "revoked" ? "danger" : "default"}>{session.status}</Badge>
                          {session.status === "active" && (
                            <button onClick={() => setRevokeSession(session)} className="text-xs text-red-400 hover:text-red-300 transition">Revoke</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Authentication Methods</h2>
                    <p className="mt-1 text-sm text-slate-400">Configure multi-factor authentication and login methods.</p>
                  </div>
                  <button onClick={() => setShowAddMethod(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> Add Method
                  </button>
                </div>
                {methods.length === 0 ? (
                  <EmptyState icon={<Key className="h-8 w-8 text-slate-500" />} title="No auth methods" description="Add authentication methods to secure your account." action={
                    <button onClick={() => setShowAddMethod(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                      <Plus className="h-4 w-4" /> Add Method
                    </button>
                  } />
                ) : (
                  <div className="mt-4 space-y-3">
                    {methods.map((method) => (
                      <div key={method.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-lg">
                            {methodIcon(method.method)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white capitalize">{method.method.replace("_", " ")}</p>
                            <p className="text-xs text-slate-500">Added {new Date(method.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={method.enabled ? "success" : "default"}>{method.enabled ? "Enabled" : "Disabled"}</Badge>
                          <button onClick={() => handleToggleMethod(method)} className="text-xs text-blue-400 hover:text-blue-300 transition">Toggle</button>
                          <button onClick={() => setDeleteMethod(method)} className="p-2 text-slate-400 hover:text-red-400 transition"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            </>
          )}
        </div>
      </PlanGate>

      <Modal open={showAddMethod} onClose={() => setShowAddMethod(false)} title="Add Authentication Method" description="Choose an authentication method to add.">
        <div className="space-y-4">
          <Select value={selectedMethod} onChange={setSelectedMethod} label="Method" options={[{ value: "password", label: "Password" }, { value: "totp", label: "TOTP (Authenticator)" }, { value: "passkey", label: "Passkey" }, { value: "email_otp", label: "Email OTP" }, { value: "sms_otp", label: "SMS OTP" }]} />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddMethod(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleAddMethod} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Add Method</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!revokeSession} onClose={() => setRevokeSession(null)} onConfirm={handleRevokeSession} title="Revoke Session" message="Are you sure you want to revoke this session? The user will be logged out." confirmLabel="Revoke" danger />

      <ConfirmModal open={!!deleteMethod} onClose={() => setDeleteMethod(null)} onConfirm={handleDeleteMethod} title="Delete Auth Method" message="Are you sure you want to remove this authentication method?" confirmLabel="Delete" danger />
    </DashboardShell>
  );
}
