"use client";
import { AdminCMS } from "@/components/admin-cms";
import { Icon } from "@/components/icons";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons } from "@/components/site";
import { Navigation } from "@/components/Navigation";
import { toast } from "@/components/toast";
import { ask } from "@/components/confirm";
import { V6Card, V6Skeleton, V6TabContent } from "@/components/v6-ui";
import { AdminQuickLinks } from "@/components/admin-quick-links";
import { BrandLoader } from "@/components/loader";
import { CustomSelect } from "@/components/custom-select";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Tab = "overview" | "messages" | "applications" | "pricing" | "users" | "rules" | "admins" | "audit" | "cron" | "cms";

export default function Admin() {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "overview";
    const value = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    return value && ["overview", "messages", "applications", "pricing", "users", "rules", "admins", "audit", "cron", "cms"].includes(value) ? value : "overview";
  });
  const [state, setState] = useState<"loading" | "ready" | "denied">("loading");
  const [me, setMe] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [cronRuns, setCronRuns] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [myIp, setMyIp] = useState("");
  const [stats, setStats] = useState<any>({});
  const [cmsPages, setCmsPages] = useState<any[]>([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const changeTab = (nextTab: Tab) => {
    setTab(nextTab);
    const url = nextTab === "overview" ? "/admin" : `/admin?tab=${nextTab}`;
    window.history.replaceState(null, "", url);
  };

  const headers = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" };
  }, []);

  const loadAll = useCallback(async () => {
    const h = await headers();
    const get = (t: string) => fetch(`/api/admin/data?type=${t}`, { headers: h });
    const readArray = async (response: Response) => {
      const body = await response.json().catch(() => null);
      return Array.isArray(body) ? body : [];
    };
    const m = await get("messages");
    if (m.status === 403) { setState("denied"); return; }
    const [a, p, us, ad, st, au, pr, meRes, pn] = await Promise.all([get("applications"), get("pricing"), get("users"), get("admins"), get("stats"), get("audit"), get("projects"), get("me"), fetch("/api/admin/cron", { headers: h })]);
    const [messagesData, appsData, pricingData, usersData, adminsData, auditData, projectsData, meData, cronData, statsData] = await Promise.all([
      readArray(m), readArray(a), readArray(p), readArray(us), readArray(ad), readArray(au), readArray(pr), meRes.json().catch(() => null), pn.json().catch(() => null), st.json().catch(() => null),
    ]);
    setMessages(messagesData); setApps(appsData); setPricing(pricingData); setUsers(usersData); setAdmins(adminsData); setStats(statsData && !Array.isArray(statsData) ? statsData : {}); setAudit(auditData); setProjects(projectsData); setMe(meData && !Array.isArray(meData) ? meData : null); setCronRuns(Array.isArray(cronData) ? cronData : []);
    setState("ready");
  }, [headers]);

  
  useEffect(() => {
    if (tab === "cms") {
      (async () => {
        const h = await headers();
        fetch("/api/cms", { headers: h }).then(r => r.json()).then(d => setCmsPages(d)).catch(() => {});
      })();
    }
  }, [tab]);

  useEffect(() => { loadAll(); fetch("/api/my-ip").then((r) => r.json()).then((d) => setMyIp(d.ip || "")).catch(() => {}); }, [loadAll]);

  const act = async (body: any, successMsg: string) => {
    const res = await fetch("/api/admin/data", { method: "POST", headers: await headers(), body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) { toast("error", d.error || "Action failed"); return; }
    toast("success", successMsg);
    await loadAll();
  };

  const savePrice = async (id: string, price: string, tag: string) => {
    const res = await fetch("/api/admin/data", { method: "PATCH", headers: await headers(), body: JSON.stringify({ id, price, tag }) });
    if (!res.ok) { toast("error", "Failed to save pricing"); return; }
    toast("success", "Pricing updated live");
    await loadAll();
  };

  const saveUserPlan = async (userId: string, tierName: string) => {
    await act({ action: "update-user-plan", user_id: userId, tier_name: tierName }, "User plan updated");
  };

  const saveRules = async (p: any) => {
    const list = (id: string) => ((document.getElementById(id) as HTMLInputElement)?.value || "").split(",").map((s) => s.trim()).filter(Boolean);
    const mode = (document.getElementById(`md-${p.id}`) as HTMLSelectElement)?.value || "active";
    const rlVal = (document.getElementById(`rl-${p.id}`) as HTMLInputElement)?.value || "";
    await act({ action: "update-project", id: p.id, mode, allowed_ips: list(`al-${p.id}`), blocked_ips: list(`bl-${p.id}`), rate_limit_per_min: rlVal }, "Rules saved for " + p.name);
  };

  if (state === "denied") return (<>
    <Navigation />
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-6"><Icons.Lock className="w-7 h-7" /></div>
        <h1 className="font-serif text-4xl font-bold text-white mb-4">Restricted area.</h1>
        <p className="text-slate-400 font-light mb-8">This console is for BotShield administrators only.</p>
        <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Go to login<Icons.ArrowRight className="w-4 h-4" /></a>
      </div>
    </main>
  </>);

  if (state === "loading") return (<><Navigation /><BrandLoader /></>);

  return (<>
    <Navigation />
    <div className="min-h-screen bg-[#020617] pt-20 lg:flex">
      <aside className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-[#07101e]/95 px-2 py-2 backdrop-blur-xl lg:sticky lg:top-20 lg:bottom-auto lg:h-[calc(100vh-5rem)] lg:w-72 lg:shrink-0 lg:border-r lg:border-t-0 lg:bg-slate-950/60 lg:px-4 lg:py-6">
        <div className="hidden border-b border-slate-800/80 px-3 pb-6 lg:block"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icons.Shield className="h-5 w-5" /></span><div><p className="font-serif text-xl font-bold text-white">BotShield</p><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Control plane</p></div></div></div>
        <nav className="flex items-center justify-around gap-1 lg:mt-6 lg:block lg:space-y-7">
          <div className="lg:space-y-1"><p className="mb-2 hidden px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 lg:block">Workspace</p>{[["overview", "Overview", "chart"], ["users", "Users", "users"], ["rules", "Project rules", "shield"], ["pricing", "Pricing", "file"]].map(([id, label, icon]) => <button key={id} onClick={() => changeTab(id as Tab)} className={`flex w-full flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium transition lg:flex-row lg:gap-3 lg:py-3 lg:text-sm ${tab === id ? "bg-blue-600/15 text-blue-300 ring-1 ring-blue-500/30" : "text-slate-500 hover:bg-slate-900 hover:text-white"}`}><Icon name={icon} className="h-4 w-4" />{label}</button>)}</div>
          <div className="hidden lg:block lg:space-y-1"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Operations</p>{[["messages", "Messages", "mail"], ["applications", "Applications", "file"], ["rules", "Security rules", "shield"], ["audit", "Audit log", "file"], ["cron", "Cron jobs", "activity"], ["admins", "Administrators", "users"]].map(([id, label, icon]) => <button key={id} onClick={() => changeTab(id as Tab)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${tab === id ? "bg-blue-600/15 text-blue-300" : "text-slate-500 hover:bg-slate-900 hover:text-white"}`}><Icon name={icon} className="h-4 w-4" />{label}</button>)}</div>
          <div className="hidden lg:block lg:space-y-1"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Tools</p><button onClick={() => changeTab("cms")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${tab === "cms" ? "bg-blue-600/15 text-blue-300" : "text-slate-500 hover:bg-slate-900 hover:text-white"}`}><Icon name="book" className="h-4 w-4" />Content CMS</button><a href="/admin/rate-limits" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-900 hover:text-white"><Icon name="zap" className="h-4 w-4" />Rate limits</a><a href="/admin/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-900 hover:text-white"><Icon name="settings" className="h-4 w-4" />Settings</a><a href="/dashboard/analytics" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-900 hover:text-white"><Icon name="trending" className="h-4 w-4" />Analytics</a><a href="/test" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-900 hover:text-white"><Icon name="flask" className="h-4 w-4" />Playground</a><a href="/docs" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-900 hover:text-white"><Icon name="book" className="h-4 w-4" />Docs</a></div>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-10 sm:px-6 lg:px-10 lg:pt-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-3"><span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">Control plane v2</span><span className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />All systems operational</span></div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">Admin Console</h1>
          <p className="mt-2 text-sm text-slate-500">{me?.email} · <span className={me?.role === "owner" ? "text-amber-400" : "text-blue-400"}>{me?.role}</span> · secure workspace</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><span className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">Live data</span><button onClick={() => loadAll()} className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-300 hover:border-blue-500/50 hover:text-white">Refresh workspace</button></div>
      </div>

      <section className="min-w-0 max-w-full">
          {me && <div className="mb-6"><AdminQuickLinks onJump={changeTab} /></div>}

          {tab === "overview" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[["Visitors", stats.visitors], ["Users", stats.users], ["Projects", stats.projects], ["Payments", stats.payments], ["Messages", stats.messages], ["Applications", stats.applications], ["Admins", stats.admins]].map(([l, v]) => (
                <motion.div key={String(l)} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                  <p className="font-serif text-3xl font-bold text-white">{String(v ?? 0)}</p>
                  <p className="text-xs text-slate-500 mt-1">{l}</p>
                </motion.div>
              ))}
            </div>
          )}

          {tab === "messages" && (
            <div className="space-y-4">
              {messages.length === 0 && <p className="text-slate-500 font-light">No messages yet.</p>}
              {messages.map((m) => (
                <div key={m.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                  <div className="flex flex-wrap justify-between gap-2 mb-2"><span className="text-white font-medium">{m.name}</span><span className="text-blue-400 text-sm">{m.email}</span></div>
                  <p className="text-slate-400 font-light text-sm whitespace-pre-wrap">{m.message}</p>
                  <div className="flex gap-2 mt-4">
                    <a href={`mailto:${m.email}`} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs">Reply</a>
                    <button onClick={() => act({ action: "delete-message", id: m.id }, "Message deleted")} className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "applications" && (
            <div className="space-y-4">
              {apps.length === 0 && <p className="text-slate-500 font-light">No applications yet.</p>}
              {apps.map((a) => (
                <div key={a.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                  <div className="flex flex-wrap justify-between gap-2 mb-1"><span className="text-white font-medium">{a.name} — <span className="text-blue-400">{a.role}</span></span><a href={a.cv_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">View CV</a></div>
                  <p className="text-slate-500 text-sm">{a.email}{a.portfolio ? ` · ${a.portfolio}` : ""}</p>
                  <p className="text-slate-400 font-light text-sm whitespace-pre-wrap mt-3">{a.note}</p>
                  <button onClick={() => act({ action: "delete-application", id: a.id }, "Application deleted")} className="mt-4 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10">Delete</button>
                </div>
              ))}
            </div>
          )}

          {tab === "pricing" && (
            <div className="space-y-4">
              {pricing.map((p) => (
                <div key={p.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-950 grid sm:grid-cols-3 gap-4 items-end">
                  <div><p className="text-white font-serif text-xl font-semibold">{p.id}</p><p className="text-xs text-slate-600 mt-1">Plan</p></div>
                  <div><label className="block text-xs text-slate-500 mb-2">Price</label><input id={`pr-${p.id}`} defaultValue={p.price} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60" /></div>
                  <div className="flex gap-2">
                    <input id={`tg-${p.id}`} defaultValue={p.tag || ""} placeholder="Tagline" className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60" />
                    <button onClick={() => savePrice(p.id, (document.getElementById(`pr-${p.id}`) as HTMLInputElement).value, (document.getElementById(`tg-${p.id}`) as HTMLInputElement).value)} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm">Save</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "users" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Users and plans</h2>
                <p className="mt-1 text-xs text-slate-500">Review registered accounts and assign any available BotShield plan. Changes are recorded in the audit log.</p>
              </div>
              {users.length === 0 && <p className="text-slate-500 font-light">No registered users found.</p>}
              {users.map((u) => (
                <div key={u.id} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium text-white">{u.email || "No email"}</p>
                    <p className="mt-1 text-xs text-slate-500">Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"} · {u.confirmed ? "Email confirmed" : "Email unconfirmed"}</p>
                    {u.last_sign_in_at && <p className="mt-1 text-xs text-slate-600">Last sign-in {new Date(u.last_sign_in_at).toLocaleString()}</p>}
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <div className="min-w-[150px]"><CustomSelect defaultValue={u.tier_name || "Hobby"} id={`user-plan-${u.id}`}><option value="Hobby">Hobby</option><option value="Pro">Pro</option><option value="Enterprise">Enterprise</option></CustomSelect></div>
                    <button onClick={() => saveUserPlan(u.id, (document.getElementById(`user-plan-${u.id}`) as HTMLInputElement).value)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500">Save plan</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "rules" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-light">Per-project controls: shadow mode logs without blocking; whitelist always allows; blacklist always blocks. Comma-separate IPs.</p>
              <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-white text-sm font-medium">Your current IP</p><code className="text-xs text-blue-300 font-mono">{myIp || "detecting..."}</code></div>
                <div className="flex gap-2">
                  <button onClick={async () => { await navigator.clipboard.writeText(myIp); toast("success", "IP copied"); }} className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300">Copy</button>
                  <button onClick={async () => { for (const p of projects) { const ips = p.allowed_ips || []; if (myIp && !ips.includes(myIp)) await act({ action: "update-project", id: p.id, mode: p.mode || "active", allowed_ips: [...ips, myIp], blocked_ips: p.blocked_ips || [] }, ""); } toast("success", "Your IP whitelisted on all projects"); }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs">Whitelist me everywhere</button>
                </div>
              </div>
              {projects.map((p) => (
                <div key={p.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-white font-medium">{p.name}</h3>
                    <code className="text-xs text-blue-300 font-mono">{p.api_key}</code>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div><label className="block text-xs text-slate-500 mb-2">Mode</label>
                      <CustomSelect id={`md-${p.id}`} defaultValue={p.mode || "active"}>
                        <option value="active">Active (block bots)</option>
                        <option value="shadow">Shadow (log only)</option>
                      </CustomSelect>
                    </div>
                    <div><label className="block text-xs text-slate-500 mb-2">Whitelist IPs</label><input id={`al-${p.id}`} defaultValue={(p.allowed_ips || []).join(", ")} placeholder="1.2.3.4, 5.6.7.8" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60" /></div>
                    <div><label className="block text-xs text-slate-500 mb-2">Blacklist IPs</label><input id={`bl-${p.id}`} defaultValue={(p.blocked_ips || []).join(", ")} placeholder="9.9.9.9" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60" /></div>
                  </div>
                  <button onClick={() => saveRules(p)} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm">Save rules</button>
                </div>
              ))}
            </div>
          )}

          {tab === "admins" && (
            <div className="space-y-6">
              <div className="space-y-3">
                {admins.map((a) => (
                  <div key={a.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
                    <div className="min-w-0"><p className="text-white text-sm font-medium break-all">{a.email}</p><p className="text-xs text-slate-600 mt-0.5">Added by {a.added_by || "system"}</p></div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-1 rounded-md text-xs ${a.role === "owner" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{a.role}</span>
                      {a.role !== "owner" && <button onClick={() => act({ action: "remove-admin", email: a.email }, "Admin removed")} className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10">Remove</button>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                <h3 className="text-white font-semibold mb-3">Add admin</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} placeholder="admin@email.com" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" />
                  <button onClick={async () => { if (!newAdmin) return; await act({ action: "add-admin", email: newAdmin }, "Admin added"); setNewAdmin(""); }} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Add</button>
                </div>
              </div>
              {me?.role === "owner" && (
                <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-amber-400 font-semibold mb-2">Transfer ownership</h3>
                  <p className="text-xs text-slate-500 font-light mb-4">Hands the entire project to another person. You become a regular admin.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="new-owner@email.com" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/60" />
                    <button onClick={async () => { if (transferTo && await ask({ title: "Transfer ownership", message: "Transfer FULL ownership to " + transferTo + "? You become a regular admin.", confirmLabel: "Transfer", danger: true })) act({ action: "transfer", email: transferTo }, "Ownership transferred"); }} className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium">Transfer</button>
                  </div>
                </div>
              )}
            </div>
          )}

                    {tab === "cron" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">Cron jobs</h2>
                  <p className="text-xs text-slate-500 font-light mt-1">Run and monitor scheduled maintenance jobs from one place.</p>
                </div>
                <button onClick={async () => {
                  toast("info", "Running cron job...");
                  const res = await fetch("/api/admin/cron", { method: "POST", headers: await headers() });
                  const d = await res.json();
                  if (!res.ok) { toast("error", d.error || "Cron job failed"); return; }
                  toast("success", "Cron job completed in " + d.duration_ms + "ms");
                  await loadAll();
                }} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Run cron now</button>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="divide-y divide-slate-800/60">
                  {cronRuns.map((p) => (
                    <div key={p.id} className="px-5 py-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                      <span className="text-slate-600 font-mono">{new Date(p.created_at).toLocaleString()}</span>
                      <span className="text-white font-medium">{p.triggered_by}</span>
                      <span className={p.status === "success" ? "text-emerald-400" : "text-red-400"}>{p.status}</span>
                      <span className="text-slate-500">{p.duration_ms}ms</span>
                      {p.result && <pre className="text-[10px] text-slate-600 font-mono break-all">{JSON.stringify(p.result).slice(0, 100)}</pre>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 text-xs text-slate-500 font-mono">who did what, when, from where</div>
              <div className="divide-y divide-slate-800/60">
                {audit.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="text-slate-600 font-mono">{new Date(a.created_at).toLocaleString()}</span>
                    <span className="text-white font-medium">{a.actor_email}</span>
                    <span className="text-blue-400">{a.action}</span>
                    <span className="text-slate-500 font-mono break-all">{a.target}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        {tab === "cms" && <AdminCMS headers={headers} loadAll={loadAll} initialPages={cmsPages || []} />}
        </main>
      </div>
    </div>
  </>);
}
