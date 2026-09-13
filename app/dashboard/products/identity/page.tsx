"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { User, Key, Fingerprint, Shield, LogOut, Plus, CheckCircle, AlertTriangle, Lock } from "lucide-react";

type Session = {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
};

type AuthMethod = {
  id: string;
  name: string;
  type: "password" | "mfa" | "sso" | "biometric";
  enabled: boolean;
  lastUsed: string;
};

type SecuritySetting = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

const mockSessions: Session[] = [
  { id: "s1", device: "MacBook Pro", browser: "Chrome 120", ip: "192.168.1.xxx", location: "San Francisco, US", lastActive: "2026-09-12T14:30:00Z", current: true },
  { id: "s2", device: "iPhone 15", browser: "Safari Mobile", ip: "10.0.0.xxx", location: "San Francisco, US", lastActive: "2026-09-12T12:00:00Z", current: false },
  { id: "s3", device: "Windows Desktop", browser: "Firefox 121", ip: "172.16.0.xxx", location: "New York, US", lastActive: "2026-09-11T22:00:00Z", current: false },
];

const mockAuthMethods: AuthMethod[] = [
  { id: "a1", name: "Email & Password", type: "password", enabled: true, lastUsed: "2026-09-12T14:30:00Z" },
  { id: "a2", name: "Authenticator App", type: "mfa", enabled: true, lastUsed: "2026-09-12T14:30:00Z" },
  { id: "a3", name: "Security Key", type: "biometric", enabled: false, lastUsed: "Never" },
];

const mockSecuritySettings: SecuritySetting[] = [
  { id: "ss1", name: "Login Notifications", description: "Receive email when a new device signs in.", enabled: true },
  { id: "ss2", name: "Require MFA for API access", description: "Enforce multi-factor authentication for all API operations.", enabled: false },
  { id: "ss3", name: "Session Timeout", description: "Auto-logout after 30 minutes of inactivity.", enabled: true },
  { id: "ss4", name: "IP Allowlist", description: "Only allow login from whitelisted IP addresses.", enabled: false },
];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function IdentityPage() {
  const [sessions] = useState<Session[]>(mockSessions);
  const [authMethods, setAuthMethods] = useState<AuthMethod[]>(mockAuthMethods);
  const [settings, setSettings] = useState<SecuritySetting[]>(mockSecuritySettings);

  const toggleSetting = (id: string) => {
    setSettings(settings.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Identity Management</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BotShield Identity</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Identity & Access</h1>
          <p className="mt-1 text-slate-400">Manage your authentication methods, active sessions, and security preferences.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["Active Sessions", sessions.length, "blue"], ["Auth Methods", authMethods.filter((a) => a.enabled).length, "emerald"], ["MFA Enabled", authMethods.some((a) => a.type === "mfa" && a.enabled) ? "Yes" : "No", "violet"], ["Security Score", "85", "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* Active Sessions */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Active Sessions</h2>
          <p className="mt-1 text-sm text-slate-400">Devices and browsers currently signed in to your account.</p>
          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {session.device} - {session.browser}
                      {session.current && <span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">Current</span>}
                    </p>
                    <p className="text-xs text-slate-500">{session.ip} &middot; {session.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{new Date(session.lastActive).toLocaleString()}</span>
                  {!session.current && (
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10">
                      <LogOut className="h-3 w-3" /> Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Auth Methods */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Authentication Methods</h2>
              <p className="mt-1 text-sm text-slate-400">Configure how you sign in to BotShield.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
              <Plus className="h-4 w-4" /> Add Method
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {authMethods.map((method) => (
              <div key={method.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    {method.type === "password" ? <Key className="h-5 w-5 text-blue-400" /> : method.type === "mfa" ? <Lock className="h-5 w-5 text-blue-400" /> : <Fingerprint className="h-5 w-5 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{method.name}</p>
                    <p className="text-xs text-slate-500">Last used: {method.lastUsed === "Never" ? "Never" : new Date(method.lastUsed).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${method.enabled ? "bg-green-500/10 text-green-400" : "bg-slate-700 text-slate-400"}`}>{method.enabled ? "Enabled" : "Disabled"}</span>
                  <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-blue-500/50 hover:text-white">Configure</button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Security Settings */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <h2 className="text-xl font-semibold text-white">Security Settings</h2>
          <div className="mt-4 space-y-3">
            {settings.map((setting) => (
              <div key={setting.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                <div>
                  <p className="text-sm font-medium text-white">{setting.name}</p>
                  <p className="text-xs text-slate-500">{setting.description}</p>
                </div>
                <button onClick={() => toggleSetting(setting.id)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${setting.enabled ? "bg-green-500/10 text-green-400" : "bg-slate-700 text-slate-400"}`}>{setting.enabled ? "Enabled" : "Disabled"}</button>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </DashboardShell>
  );
}
