"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons, MotionLink } from "@/components/site";
import { Navigation } from "@/components/Navigation";
import { toast } from "@/components/toast";
import { ask } from "@/components/confirm";
import { BrandLoader } from "@/components/loader";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const gen = (p: string) => p + Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

const PLANS: Record<string, any> = {
  Hobby: { price: "$0", maxProjects: 2, requests: "1K / mo", analytics: "7 days", feats: ["1,000 requests / month", "Core behavioral detection", "Community support", "Full source access"], locked: ["Adaptive AI scoring", "100K requests / month", "90-day analytics", "Priority support"] },
  Pro: { price: "$29", maxProjects: 10, requests: "100K / mo", analytics: "90 days", feats: ["100,000 requests / month", "Adaptive AI scoring", "Live analytics dashboard", "Priority email support", "99.9% uptime SLA"], locked: [] },
  Enterprise: { price: "Custom", maxProjects: 999, requests: "Unlimited", analytics: "Unlimited", feats: ["Unlimited requests", "Dedicated infrastructure", "On-premise deployment", "24/7 support with SLA"], locked: [] },
};

type Tab = "overview" | "projects" | "analytics" | "plan" | "settings";
const TABS: Tab[] = ["overview", "projects", "analytics", "plan", "settings"];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [projects, setProjects] = useState<any[]>([]);
  const [tier, setTier] = useState("Hobby");
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");
  const [newPass, setNewPass] = useState("");
  const [net, setNet] = useState({ total: 0, blocked: 0 });
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const plan = PLANS[tier] || PLANS.Hobby;

  const go = (t: Tab) => { setTab(t); window.history.replaceState(null, "", "#" + t); };

  const load = async (uid: string) => {
    const { data } = await supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    setProjects(data || []);
    const { data: sub } = await supabase.from("subscription_stats").select("tier_name").eq("user_id", uid).single();
    let t = sub?.tier_name || "Hobby";
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch("/api/admin/data?type=me", { headers: { Authorization: "Bearer " + (sess?.session?.access_token || "") } });
      if (r.ok) { const me = await r.json(); if (me.role === "owner") t = "Enterprise"; else if (me.role === "admin" && t === "Hobby") t = "Pro"; } }
    } catch {}
    setTier(t);
  };

  useEffect(() => {
    const applyHash = () => { const h = window.location.hash.replace("#", "") as Tab; if (TABS.includes(h)) setTab(h); };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user) await load(data.session.user.id);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setUser(s?.user ?? null);
      if (s?.user) await load(s.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadNet = () => fetch("/api/stats/realtime").then((r) => r.json()).then((x) => setNet({ total: x.totalRequests || 0, blocked: x.blockedBots || 0 })).catch(() => {});
    loadNet();
    const iv = setInterval(loadNet, 15000);
    return () => clearInterval(iv);
  }, []);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || name.trim().length < 2) { toast("error", "Project name must be at least 2 characters"); return; }
    if (projects.length >= plan.maxProjects) { toast("error", plan.maxProjects + " projects max on " + tier + ". Upgrade to Pro for more."); return; }
    const { error } = await supabase.from("projects").insert({ user_id: user.id, name: name.trim(), api_key: gen("bs_live_"), secret_key: gen("bs_sec_") });
    if (error) { toast("error", error.message); return; }
    setName(""); await load(user.id); toast("success", "Project created. Keys are live.");
  };

  const rotateKeys = async (p: any) => {
    if (!(await ask({ title: "Rotate keys", message: "Revoke current keys and generate new ones for " + p.name + "? Old keys stop working immediately.", confirmLabel: "Rotate" }))) return;
    await supabase.from("projects").update({ api_key: gen("bs_live_"), secret_key: gen("bs_sec_") }).eq("id", p.id);
    await load(user.id); toast("success", "Keys rotated. Old keys are dead.");
  };

  const deleteProject = async (p: any) => {
    if (!(await ask({ title: "Delete project", message: "Delete " + p.name + " permanently? This cannot be undone.", confirmLabel: "Delete", danger: true }))) return;
    await supabase.from("projects").delete().eq("id", p.id);
    await load(user.id); toast("success", "Project deleted");
  };

  const copy = async (text: string, id: string) => { await navigator.clipboard.writeText(text); setCopied(id); toast("success", "Copied to clipboard"); setTimeout(() => setCopied(""), 1500); };

  const setPlan = async (t: string) => {
    if (t === "Enterprise") { toast("info", "Email info.bravehx@gmail.com for Enterprise onboarding"); return; }
    await supabase.from("subscription_stats").delete().eq("user_id", user.id);
    await supabase.from("subscription_stats").insert({ tier_name: t, user_id: user.id });
    setTier(t); toast("success", t === "Pro" ? "Upgraded to Pro. Stripe checkout arrives next." : "Moved to " + t);
  };

  const changePass = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) toast("error", error.message); else { toast("success", "Password updated"); setNewPass(""); }
  };

  if (loading) return (<><Navigation /><BrandLoader /></>);

  if (!user) return (<>
    <Navigation />
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-white mb-4">Your dashboard awaits.</h1>
        <MotionLink href="/login" whileHover={{ scale: 1.04 }} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Go to login<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
      </div>
    </main>
  </>);

  const dashMenu = [
    { label: "Project Overview", href: "#overview" },
    { label: "Projects & Keys", href: "#projects" },
    { label: "Analytics", href: "#analytics" },
    { label: "Plan & Billing", href: "#plan" },
    { label: "Settings", href: "#settings" },
    { label: "API Playground", href: "/test" },
    { label: "Documentation", href: "/docs" },
  ];

  const groups: { label: string; items: { id: Tab; label: string; Icon: any }[] }[] = [
    { label: "Platform", items: [
      { id: "overview", label: "Project Overview", Icon: Icons.Shield },
      { id: "projects", label: "Projects & Keys", Icon: Icons.Chip },
      { id: "analytics", label: "Analytics", Icon: Icons.Chart },
    ]},
    { label: "Account", items: [
      { id: "plan", label: "Plan & Billing", Icon: Icons.Bolt },
      { id: "settings", label: "Settings", Icon: Icons.Lock },
    ]},
  ];

  return (<>
    <Navigation menu={dashMenu} />
    <main className="pt-28 pb-24 max-w-7xl mx-auto px-4 sm:px-6 w-full">
      <div className="lg:hidden flex justify-end mb-4"><button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-xs">Sign out</button></div>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
        <aside className="hidden lg:block min-w-0 max-w-full lg:sticky lg:top-28 self-start">
          <div className="flex flex-col gap-1">
            <div className="hidden lg:flex items-center gap-3 px-3 py-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-serif text-lg font-bold flex items-center justify-center shrink-0">{(user.email || "B")[0].toUpperCase()}</div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium break-all leading-tight">{user.email}</p>
                <p className="text-[11px] text-slate-500">{tier} plan</p>
              </div>
            </div>
            {groups.map((g) => (
              <div key={g.label} className="lg:mb-4 shrink-0 lg:shrink">
                <p className="hidden lg:block text-[11px] tracking-[0.2em] uppercase text-slate-600 px-3 mb-2">{g.label}</p>
                {g.items.map((it) => (
                  <button key={it.id} onClick={() => go(it.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap w-full text-left ${tab === it.id ? "bg-slate-800/80 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}>
                    <it.Icon className="w-4 h-4 shrink-0" />{it.label}
                  </button>
                ))}
              </div>
            ))}
            <div className="lg:mb-2 shrink-0 lg:shrink">
              <p className="hidden lg:block text-[11px] tracking-[0.2em] uppercase text-slate-600 px-3 mb-2">Resources</p>
              <a href="/test" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-900 whitespace-nowrap"><Icons.Terminal className="w-4 h-4" />API Playground</a>
              <a href="/docs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-900 whitespace-nowrap"><Icons.Globe className="w-4 h-4" />Documentation</a>
              <a href="https://github.com/brave290/bot-shield" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-900 whitespace-nowrap"><Icons.Github className="w-4 h-4" />Source code</a>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 whitespace-nowrap shrink-0 lg:shrink"><Icons.ArrowRight className="w-4 h-4 rotate-180" />Sign out</button>
          </div>
        </aside>

        <section className="min-w-0 max-w-full space-y-6">
          {tab === "overview" && (<>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-blue-950/30">
              <h1 className="font-serif text-3xl font-bold text-white mb-1">Welcome back.</h1>
              <p className="text-sm text-slate-400 font-light">Your shield is active. {net.blocked.toLocaleString()} bots blocked across the network so far.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950"><p className="font-serif text-3xl font-bold text-white">{projects.length}/{plan.maxProjects}</p><p className="text-xs text-slate-500 mt-1">Projects used</p></div>
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950"><p className="font-serif text-3xl font-bold text-white">{net.total.toLocaleString()}</p><p className="text-xs text-slate-500 mt-1">Network requests (live)</p></div>
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950"><p className="font-serif text-3xl font-bold text-white">{tier}</p><p className="text-xs text-slate-500 mt-1">Current plan</p></div>
            </div>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
              <h2 className="font-serif text-xl font-semibold text-white mb-4">Quick start</h2>
              <ol className="space-y-3 text-sm text-slate-400 font-light list-decimal list-inside">
                <li>Create a project under Projects & Keys.</li>
                <li>Paste the generated script tag into your site.</li>
                <li>Verify tokens on your backend with your secret key.</li>
                <li>Stress-test everything in the <a href="/test" className="text-blue-400 hover:underline">API Playground</a>.</li>
              </ol>
            </div>
          </>)}

          {tab === "projects" && (<>
            <form onSubmit={createProject} className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
              <h2 className="font-serif text-xl font-semibold text-white">New project</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name (e.g. my-shop)" className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" />
                <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Create project</button>
              </div>
            </form>
            {projects.length === 0 && <div className="text-center py-14 border border-dashed border-slate-800 rounded-2xl"><p className="text-slate-500 font-light">No projects yet. Create your first one above.</p></div>}
            {projects.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0"><h2 className="font-serif text-xl font-semibold text-white break-all">{p.name}</h2><span className="text-xs text-emerald-400 flex items-center gap-1.5 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => rotateKeys(p)} className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 text-xs hover:bg-amber-500/10">Rotate keys</button>
                    <button onClick={() => deleteProject(p)} className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10">Delete</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <code className="flex-1 min-w-0 text-xs text-blue-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono break-all">{p.api_key}</code>
                    <button onClick={() => copy(p.api_key, p.id + "a")} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500 shrink-0">{copied === p.id + "a" ? "Copied" : "Copy"}</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 min-w-0 text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono break-all">{revealed[p.id] ? p.secret_key : "bs_sec_••••••••••••••••"}</code>
                    <button onClick={() => setRevealed({ ...revealed, [p.id]: !revealed[p.id] })} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500 shrink-0">{revealed[p.id] ? "Hide" : "Reveal"}</button>
                    <button onClick={() => copy(p.secret_key, p.id + "s")} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500 shrink-0">{copied === p.id + "s" ? "Copied" : "Copy"}</button>
                  </div>
                </div>
                <pre className="mt-5 p-4 rounded-xl bg-slate-900 border border-slate-800 text-[12px] leading-6 text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">{`<script src="${origin}/bot-shield.js"\n        data-api-key="${p.api_key}"></script>`}</pre>
              </motion.div>
            ))}
          </>)}

          {tab === "analytics" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between mb-2"><p className="text-xs text-slate-500">Network requests</p><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /></div>
                <p className="font-serif text-4xl font-bold text-white tabular-nums">{net.total.toLocaleString()}</p>
              </div>
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between mb-2"><p className="text-xs text-slate-500">Bots blocked</p><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /></div>
                <p className="font-serif text-4xl font-bold text-white tabular-nums">{net.blocked.toLocaleString()}</p>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-5">
              <h2 className="font-serif text-xl font-semibold text-white">Your usage</h2>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-2"><span>Projects</span><span>{projects.length} / {plan.maxProjects}</span></div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: Math.min(100, (projects.length / plan.maxProjects) * 100) + "%" }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800"><p className="text-slate-500 text-xs mb-1">Request quota</p><p className="text-white font-medium">{plan.requests}</p></div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800"><p className="text-slate-500 text-xs mb-1">Analytics retention</p><p className="text-white font-medium">{plan.analytics}</p></div>
              </div>
            </div>
          </>)}

          {tab === "plan" && (<>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(PLANS).map(([pn, pl]: [string, any]) => (
                <div key={pn} className={`relative p-6 rounded-2xl border ${tier === pn ? "border-blue-500 bg-blue-600/5" : "border-slate-800 bg-slate-950"}`}>
                  {pn === "Pro" && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-medium whitespace-nowrap">Most popular</span>}
                  <h3 className="font-serif text-xl font-semibold text-white">{pn}</h3>
                  <p className="text-xs text-slate-500 font-light mb-4">{pn === "Hobby" ? "Side projects" : pn === "Pro" ? "Real products" : "Platforms"}</p>
                  <p className="mb-5"><span className="font-serif text-4xl font-bold text-white">{pl.price}</span>{pl.price !== "Custom" && <span className="text-slate-500 text-sm"> /mo</span>}</p>
                  <ul className="space-y-2.5 mb-6">
                    {pl.feats.map((f: string) => (<li key={f} className="flex items-start gap-2 text-xs text-slate-300 font-light"><span className="text-blue-400 mt-0.5 shrink-0"><Icons.Check /></span>{f}</li>))}
                  </ul>
                  {tier === pn ? (
                    <p className="text-center text-xs text-blue-400 py-2.5 border border-blue-500/40 rounded-xl">Current plan</p>
                  ) : (
                    <button onClick={() => setPlan(pn)} className={`w-full py-2.5 rounded-xl text-xs font-medium ${pn === "Enterprise" ? "border border-slate-700 hover:border-slate-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>Choose {pn}</button>
                  )}
                </div>
              ))}
            </div>
            {tier === "Hobby" && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                <h3 className="text-sm text-slate-500 font-medium mb-3">Locked on free</h3>
                <ul className="space-y-2 text-sm text-slate-500 font-light">
                  {plan.locked.map((l: string) => (<li key={l} className="flex gap-2"><Icons.Lock className="w-4 h-4 shrink-0" />{l}</li>))}
                </ul>
                <p className="text-xs text-slate-600 mt-5">Stripe checkout arrives next. Upgrades now are grace-period activations.</p>
              </div>
            )}
          </>)}

          {tab === "settings" && (<>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
              <h2 className="font-serif text-xl font-semibold text-white">Security</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} minLength={6} placeholder="New password" className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" />
                <button onClick={changePass} className="px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-sm text-white">Update password</button>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
              <h2 className="font-serif text-xl font-semibold text-white">Integrations & self-host</h2>
              <a href="https://github.com/brave290/bot-shield" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Github /><span className="text-sm text-slate-300">Self-host BotShield from GitHub</span></a>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Chip /><span className="text-sm text-slate-300">Supabase console (your data)</span></a>
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Mail /><span className="text-sm text-slate-300">Resend (email delivery)</span></a>
            </div>
          </>)}
        </section>
      </div>
    </main>
    <footer className="border-t border-slate-800/60 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-600">© 2026 BotShield · BraveHX Studio</p>
        <a href="https://github.com/brave290/bot-shield" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors"><Icons.Github className="w-4 h-4" />View source on GitHub</a>
      </div>
    </footer>
  </>);
}
