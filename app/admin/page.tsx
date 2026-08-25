"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons, Footer } from "@/components/site";
import { Navigation } from "@/components/Navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Admin() {
  const [tab, setTab] = useState<"messages" | "applications" | "pricing">("messages");
  const [state, setState] = useState<"loading" | "ready" | "denied">("loading");
  const [messages, setMessages] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);

  const headers = async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" };
  };

  useEffect(() => {
    (async () => {
      const h = await headers();
      const [m, a, p] = await Promise.all([
        fetch("/api/admin/data?type=messages", { headers: h }),
        fetch("/api/admin/data?type=applications", { headers: h }),
        fetch("/api/admin/data?type=pricing", { headers: h }),
      ]);
      if (m.status === 403) { setState("denied"); return; }
      setMessages(await m.json()); setApps(await a.json()); setPricing(await p.json());
      setState("ready");
    })();
  }, []);

  const savePrice = async (id: string, price: string, tag: string) => {
    const res = await fetch("/api/admin/data", { method: "PATCH", headers: await headers(), body: JSON.stringify({ id, price, tag }) });
    if (res.ok) setPricing((await res.json()) && pricing.map((p) => (p.id === id ? { ...p, price, tag } : p)));
  };

  if (state === "denied") return (<>
    <Navigation />
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-white mb-4">Admins only.</h1>
        <p className="text-slate-400 font-light mb-8">Sign in with an admin account to continue.</p>
        <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Go to login<Icons.ArrowRight className="w-4 h-4" /></a>
      </div>
    </main>
    <Footer />
  </>);

  if (state === "loading") return <div className="min-h-screen bg-slate-950" />;

  return (<>
    <Navigation />
    <main className="pt-32 pb-28 max-w-6xl mx-auto px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <h1 className="font-serif text-4xl font-bold text-white">Admin Console</h1>
        <a href="/admin/rate-limits" className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-sm text-slate-300">Rate limits</a>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {(["messages", "applications", "pricing"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize whitespace-nowrap ${tab === t ? "bg-blue-600 text-white" : "border border-slate-800 text-slate-400 hover:text-white"}`}>{t}</button>
        ))}
      </div>

      {tab === "messages" && (
        <div className="space-y-4">
          {messages.length === 0 && <p className="text-slate-500 font-light">No messages yet.</p>}
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <span className="text-white font-medium">{m.name}</span>
                <a className="text-blue-400 text-sm" href={`mailto:${m.email}`}>{m.email}</a>
              </div>
              <p className="text-slate-400 font-light text-sm whitespace-pre-wrap">{m.message}</p>
              <p className="text-xs text-slate-600 mt-3">{new Date(m.created_at).toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "applications" && (
        <div className="space-y-4">
          {apps.length === 0 && <p className="text-slate-500 font-light">No applications yet.</p>}
          {apps.map((a) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <span className="text-white font-medium">{a.name} — <span className="text-blue-400">{a.role}</span></span>
                <a className="text-blue-400 text-sm" href={a.cv_url} target="_blank" rel="noopener noreferrer">View CV</a>
              </div>
              <p className="text-slate-500 text-sm">{a.email}{a.portfolio ? ` · ${a.portfolio}` : ""}</p>
              <p className="text-slate-400 font-light text-sm whitespace-pre-wrap mt-3">{a.note}</p>
              <p className="text-xs text-slate-600 mt-3">{new Date(a.created_at).toLocaleString()}</p>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "pricing" && (
        <div className="space-y-4">
          {pricing.map((p) => (
            <div key={p.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-950 grid sm:grid-cols-3 gap-4 items-end">
              <div><p className="text-white font-serif text-xl font-semibold mb-1">{p.id}</p><p className="text-xs text-slate-600">Plan</p></div>
              <div><label className="block text-xs text-slate-500 mb-2">Price</label><input id={`price-${p.id}`} defaultValue={p.price} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60" /></div>
              <div className="flex gap-2">
                <input id={`tag-${p.id}`} defaultValue={p.tag || ""} placeholder="Tagline" className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60" />
                <button onClick={() => savePrice(p.id, (document.getElementById(`price-${p.id}`) as HTMLInputElement).value, (document.getElementById(`tag-${p.id}`) as HTMLInputElement).value)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm">Save</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
    <Footer />
  </>);
}
