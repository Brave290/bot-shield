"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons, MotionLink } from "@/components/site";
import { Navigation } from "@/components/Navigation";
import { toast } from "@/components/toast";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const gen = (p: string) => p + Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

const PLANS: Record<string, any> = {
  Hobby: { price: "$0", maxProjects: 2, requests: "1K / mo", analytics: "7 days", locked: ["Adaptive AI scoring", "100K requests / month", "90-day analytics", "Priority support"] },
  Pro: { price: "$29", maxProjects: 10, requests: "100K / mo", analytics: "90 days", locked: [] },
};

type Tab = "overview" | "projects" | "plan" | "settings";

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
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const plan = PLANS[tier] || PLANS.Hobby;

  const load = async (uid: string) => {
    const { data } = await supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    setProjects(data || []);
    const { data: sub } = await supabase.from("subscription_stats").select("tier_name").eq("user_id", uid).single();
    setTier(sub?.tier_name || "Hobby");
  };

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

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || name.trim().length < 2) { toast("error", "Project name must be at least 2 characters"); return; }
    if (projects.length >= plan.maxProjects) { toast("error", `Free plan allows ${plan.maxProjects} projects. Upgrade to Pro for more.`); return; }
    const { error } = await supabase.from("projects").insert({ user_id: user.id, name: name.trim(), api_key: gen("bs_live_"), secret_key: gen("bs_sec_") });
    if (error) { toast("error", error.message); return; }
    setName("");
    await load(user.id);
    toast("success", "Project created. Keys are live.");
  };

  const rotateKeys = async (p: any) => {
    if (!confirm("Revoke current keys and generate new ones for " + p.name + "?")) return;
    await supabase.from("projects").update({ api_key: gen("bs_live_"), secret_key: gen("bs_sec_") }).eq("id", p.id);
    await load(user.id);
    toast("success", "Keys rotated. Old keys are dead.");
  };

  const deleteProject = async (p: any) => {
    if (!confirm("Delete " + p.name + " permanently?")) return;
    await supabase.from("projects").delete().eq("id", p.id);
    await load(user.id);
    toast("success", "Project deleted");
  };

  const copy = async (text: string, id: string) => { await navigator.clipboard.writeText(text); setCopied(id); toast("success", "Copied to clipboard"); setTimeout(() => setCopied(""), 1500); };

  const setPlan = async (t: string) => {
    await supabase.from("subscription_stats").delete().eq("user_id", user.id);
    await supabase.from("subscription_stats").insert({ tier_name: t, user_id: user.id });
    setTier(t);
    toast("success", t === "Pro" ? "Upgraded to Pro. Stripe checkout arrives next — enjoy the grace period." : "Moved to " + t);
  };

  const changePass = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) toast("error", error.message); else { toast("success", "Password updated"); setNewPass(""); }
  };

  if (loading) return (<><Navigation /><div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="mx-auto w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" /></div></>);

  if (!user) return (<>
    <Navigation />
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-white mb-4">Your dashboard awaits.</h1>
        <MotionLink href="/login" whileHover={{ scale: 1.04 }} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Go to login<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
      </div>
    </main>
  </>);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "projects", label: `Projects (${projects.length}/${plan.maxProjects})` },
    { id: "plan", label: "Plan & billing" },
    { id: "settings", label: "Settings" },
  ];

  return (<>
    <Navigation />
    <main className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-serif text-xl font-bold flex items-center justify-center shrink-0">{(user.email || "B")[0].toUpperCase()}</div>
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold text-white break-all">{user.email}</h1>
            <p className="text-xs text-slate-500">{tier} plan · Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tier === "Pro" ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-400"}`}>{tier}</span>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap text-left ${tab === t.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"}`}>{t.label}</button>
          ))}
        </aside>

        <section className="min-w-0 space-y-6">
          {tab === "overview" && (<>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950"><p className="font-serif text-3xl font-bold text-white">{projects.length}/{plan.maxProjects}</p><p className="text-xs text-slate-500 mt-1">Projects used</p></div>
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950"><p className="font-serif text-3xl font-bold text-white">{plan.requests}</p><p className="text-xs text-slate-500 mt-1">Request quota</p></div>
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950"><p className="font-serif text-3xl font-bold text-white">{plan.analytics}</p><p className="text-xs text-slate-500 mt-1">Analytics retention</p></div>
            </div>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
              <h2 className="font-serif text-xl font-semibold text-white mb-4">Quick start</h2>
              <ol className="space-y-3 text-sm text-slate-400 font-light list-decimal list-inside">
                <li>Create a project in the Projects tab.</li>
                <li>Copy the script tag into your website's HTML.</li>
                <li>Verify tokens on your backend with your secret key.</li>
                <li>Test everything at <a href="/test" className="text-blue-400 hover:underline">/test</a> with live demo keys.</li>
              </ol>
            </div>
          </>)}

          {tab === "projects" && (<>
            <form onSubmit={createProject} className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
              <h2 className="font-serif text-xl font-semibold text-white">New project</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name (e.g. my-shop)" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" />
                <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Create project</button>
              </div>
            </form>
            {projects.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-serif text-xl font-semibold text-white">{p.name}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => rotateKeys(p)} className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 text-xs hover:bg-amber-500/10">Rotate keys</button>
                    <button onClick={() => deleteProject(p)} className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10">Delete</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-xs text-blue-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono break-all">{p.api_key}</code>
                    <button onClick={() => copy(p.api_key, p.id + "a")} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500">{copied === p.id + "a" ? "Copied" : "Copy"}</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono break-all">{revealed[p.id] ? p.secret_key : "bs_sec_••••••••••••••••"}</code>
                    <button onClick={() => setRevealed({ ...revealed, [p.id]: !revealed[p.id] })} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500">{revealed[p.id] ? "Hide" : "Reveal"}</button>
                    <button onClick={() => copy(p.secret_key, p.id + "s")} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500">{copied === p.id + "s" ? "Copied" : "Copy"}</button>
                  </div>
                </div>
                <pre className="mt-5 p-4 rounded-xl bg-slate-900 border border-slate-800 text-[12px] leading-6 text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">{`<script src="${origin}/bot-shield.js"\n        data-api-key="${p.api_key}"></script>`}</pre>
              </motion.div>
            ))}
          </>)}

          {tab === "plan" && (<>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h2 className="font-serif text-2xl font-bold text-white">{tier} plan</h2><p className="text-sm text-slate-500">{plan.price} · {plan.requests} · {plan.analytics} analytics</p></div>
                {tier === "Hobby" ? (
                  <button onClick={() => setPlan("Pro")} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Upgrade to Pro</button>
                ) : (
                  <button onClick={() => setPlan("Hobby")} className="px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 text-sm">Downgrade</button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm text-emerald-400 font-medium mb-3">Included</h3>
                  <ul className="space-y-2 text-sm text-slate-300 font-light">
                    <li className="flex gap-2"><Icons.Check className="text-emerald-400" />Core behavioral detection</li>
                    <li className="flex gap-2"><Icons.Check className="text-emerald-400" />{plan.maxProjects} projects</li>
                    <li className="flex gap-2"><Icons.Check className="text-emerald-400" />{plan.requests} requests</li>
                    <li className="flex gap-2"><Icons.Check className="text-emerald-400" />Full source access</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm text-slate-500 font-medium mb-3">{tier === "Pro" ? "Everything unlocked" : "Locked on free"}</h3>
                  <ul className="space-y-2 text-sm text-slate-500 font-light">
                    {plan.locked.map((l: string) => (<li key={l} className="flex gap-2"><Icons.Lock className="w-4 h-4" />{l}</li>))}
                    {tier === "Pro" && <li className="flex gap-2 text-slate-300"><Icons.Check className="text-emerald-400" />All Pro features active</li>}
                  </ul>
                </div>
              </div>
              {tier === "Hobby" && <p className="text-xs text-slate-600 mt-6">Stripe checkout arrives next. Upgrades now are grace-period manual activations.</p>}
            </div>
          </>)}

          {tab === "settings" && (<>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
              <h2 className="font-serif text-xl font-semibold text-white">Security</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} minLength={6} placeholder="New password" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" />
                <button onClick={changePass} className="px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-sm text-white">Update password</button>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
              <h2 className="font-serif text-xl font-semibold text-white">Integrations & self-host</h2>
              <a href="https://github.com/brave290/bot-shield" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Github /><span className="text-sm text-slate-300">Self-host BotShield from GitHub</span></a>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Chip /><span className="text-sm text-slate-300">Supabase console (your data)</span></a>
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Mail /><span className="text-sm text-slate-300">Resend (email delivery)</span></a>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} className="px-6 py-3 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10">Sign out</button>
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
