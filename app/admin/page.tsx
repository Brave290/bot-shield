"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons } from "@/components/site";
import { Navigation } from "@/components/Navigation";
import { toast } from "@/components/toast";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Tab = "overview" | "messages" | "applications" | "pricing" | "admins";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("overview");
  const [state, setState] = useState<"loading" | "ready" | "denied">("loading");
  const [me, setMe] = useState<{ email: string; role: string } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [newAdmin, setNewAdmin] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const headers = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" };
  }, []);

  const loadAll = useCallback(async () => {
    const h = await headers();
    const get = (t: string) => fetch(`/api/admin/data?type=${t}`, { headers: h });
    const m = await get("messages");
    if (m.status === 403) { setState("denied"); return; }
    const [a, p, ad, st] = await Promise.all([get("applications"), get("pricing"), get("admins"), get("stats")]);
    setMessages(await m.json()); setApps(await a.json()); setPricing(await p.json());
    const adminRows = await ad.json(); setAdmins(adminRows); setStats(await st.json());
    const { data } = await supabase.auth.getUser();
    setMe(adminRows.find((r: any) => r.email === data.user?.email) || null);
    setState("ready");
  }, [headers]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const act = async (body: any, successMsg: string, reload = true) => {
    const res = await fetch("/api/admin/data", { method: "POST", headers: await headers(), body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) { toast("error", d.error || "Action failed"); return; }
    toast("success", successMsg);
    if (reload) await loadAll();
  };

  const savePrice = async (id: string, price: string, tag: string) => {
    const res = await fetch("/api/admin/data", { method: "PATCH", headers: await headers(), body: JSON.stringify({ id, price, tag }) });
    if (!res.ok) { toast("error", "Failed to save pricing"); return; }
    toast("success", "Pricing updated live");
    await loadAll();
  };

  if (state === "denied") return (<>
    <Navigation />
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-6"><Icons.Lock className="w-7 h-7" /></div>
        <h1 className="font-serif text-4xl font-bold text-white mb-4">Restricted area.</h1>
        <p className="text-slate-400 font-light mb-8">This console is for BotShield administrators only. Sign in with an authorized admin account to continue.</p>
        <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Go to login<Icons.ArrowRight className="w-4 h-4" /></a>
      </div>
    </main>
  </>);

  if (state === "loading") return (<><Navigation /><div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="mx-auto w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" /></div></>);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "messages", label: `Messages (${messages.length})` },
    { id: "applications", label: `Applications (${apps.length})` },
    { id: "pricing", label: "Pricing" },
    { id: "admins", label: "Admins" },
  ];

  return (<>
    <Navigation />
    <main className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-4xl font-bold text-white">Admin Console</h1>
          <p className="text-sm text-slate-500 mt-1">{me?.email} · <span className={me?.role === "owner" ? "text-amber-400" : "text-blue-400"}>{me?.role}</span></p>
        </div>
        <a href="/admin/rate-limits" className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-sm text-slate-300">Rate limits</a>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap text-left ${tab === t.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}>{t.label}</button>
          ))}
        </aside>

        <section className="min-w-0">
          {tab === "overview" && (
            <div className="grid sm:grid-cols-2 gap-4">
              {[["Messages", stats.messages], ["Applications", stats.applications], ["Projects", stats.projects], ["Admins", stats.admins]].map(([l, v]) => (
                <motion.div key={String(l)} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                  <p className="font-serif text-4xl font-bold text-white">{String(v)}</p>
                  <p className="text-xs text-slate-500 mt-1">{l}</p>
                </motion.div>
              ))}
            </div>
          )}

          {tab === "messages" && (
            <div className="space-y-4">
              {messages.length === 0 && <p className="text-slate-500 font-light">No messages yet.</p>}
              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                  <div className="flex flex-wrap justify-between gap-2 mb-2">
                    <span className="text-white font-medium">{m.name}</span>
                    <span className="text-blue-400 text-sm">{m.email}</span>
                  </div>
                  <p className="text-slate-400 font-light text-sm whitespace-pre-wrap">{m.message}</p>
                  <div className="flex gap-2 mt-4">
                    <a href={`mailto:${m.email}`} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs">Reply</a>
                    <button onClick={() => act({ action: "delete-message", id: m.id }, "Message deleted")} className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10">Delete</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {tab === "applications" && (
            <div className="space-y-4">
              {apps.length === 0 && <p className="text-slate-500 font-light">No applications yet.</p>}
              {apps.map((a) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                  <div className="flex flex-wrap justify-between gap-2 mb-1">
                    <span className="text-white font-medium">{a.name} — <span className="text-blue-400">{a.role}</span></span>
                    <a href={a.cv_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">View CV</a>
                  </div>
                  <p className="text-slate-500 text-sm">{a.email}{a.portfolio ? ` · ${a.portfolio}` : ""}</p>
                  <p className="text-slate-400 font-light text-sm whitespace-pre-wrap mt-3">{a.note}</p>
                  <button onClick={() => act({ action: "delete-application", id: a.id }, "Application deleted")} className="mt-4 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10">Delete</button>
                </motion.div>
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

          {tab === "admins" && (
            <div className="space-y-6">
              <div className="space-y-3">
                {admins.map((a) => (
                  <div key={a.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium break-all">{a.email}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Added by {a.added_by || "system"}</p>
                    </div>
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
                  <p className="text-xs text-slate-500 font-light mb-4">Hands the entire project to another person. You become a regular admin. This cannot be undone unless they transfer it back.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="new-owner@email.com" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/60" />
                    <button onClick={() => { if (transferTo && confirm("Transfer FULL ownership to " + transferTo + "? You will become a regular admin.")) act({ action: "transfer", email: transferTo }, "Ownership transferred"); }} className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium">Transfer</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  </>);
}
