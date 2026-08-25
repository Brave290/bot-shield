"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons, MotionLink } from "@/components/site";
import { Navigation } from "@/components/Navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const gen = (p: string) => p + Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [totalReqs, setTotalReqs] = useState(0);

  const load = async (uid: string) => {
    const { data, error } = await supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    if (error) setErr(error.message); else setProjects(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user) await load(data.session.user.id);
      fetch("/api/stats/realtime").then((r) => r.json()).then((d) => setTotalReqs(d.totalRequests || 0)).catch(() => {});
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
    setErr("");
    if (!user || name.trim().length < 2) { setErr("Project name must be at least 2 characters."); return; }
    const { error } = await supabase.from("projects").insert({ user_id: user.id, name: name.trim(), api_key: gen("bs_live_"), secret_key: gen("bs_sec_") });
    if (error) { setErr(error.message); return; }
    setName("");
    await load(user.id);
  };

  const rotateKeys = async (p: any) => {
    if (!confirm("Revoke current keys and generate new ones for " + p.name + "? Old keys stop working immediately.")) return;
    await supabase.from("projects").update({ api_key: gen("bs_live_"), secret_key: gen("bs_sec_") }).eq("id", p.id);
    await load(user.id);
  };

  const deleteProject = async (p: any) => {
    if (!confirm("Delete " + p.name + " permanently? This cannot be undone.")) return;
    await supabase.from("projects").delete().eq("id", p.id);
    await load(user.id);
  };

  const copy = async (text: string, id: string) => { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 1500); };
  const changePass = async () => { const { error } = await supabase.auth.updateUser({ password: newPass }); setPassMsg(error ? error.message : "Password updated."); setNewPass(""); };

  if (loading) return (<>
    <Navigation />
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="mt-4 text-sm text-slate-500">Loading your workspace...</p>
      </div>
    </div>
  </>);

  if (!user) return (<>
    <Navigation />
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-white mb-4">Your dashboard awaits.</h1>
        <MotionLink href="/login" whileHover={{ scale: 1.04 }} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Go to login<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
      </div>
    </main>
  </>);

  return (<>
    <Navigation />
    <main className="pt-32 pb-20 max-w-6xl mx-auto px-6">
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 to-blue-950/30 flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-serif text-2xl font-bold flex items-center justify-center">{(user.email || "B")[0].toUpperCase()}</div>
          <div className="min-w-0"><h1 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-white break-all">{user.email}</h1>
            <p className="text-xs text-slate-500">Free plan · Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-sm text-slate-300">Sign out</button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950"><p className="font-serif text-3xl font-bold text-white">{projects.length}</p><p className="text-xs text-slate-500 mt-1">Projects</p></div>
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950"><p className="font-serif text-3xl font-bold text-white">{totalReqs.toLocaleString()}</p><p className="text-xs text-slate-500 mt-1">Network requests</p></div>
      </div>

      {/* Create project */}
      <form onSubmit={createProject} className="p-6 rounded-2xl border border-slate-800 bg-slate-950 mb-8 space-y-4">
        <h2 className="font-serif text-xl font-semibold text-white">New project</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name (e.g. my-shop)" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" />
          <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Create project</button>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </form>

      {/* Projects */}
      <div className="space-y-6 mb-12">
        {projects.map((p) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold text-white">{p.name}</h2>
              <span className="text-xs text-emerald-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => rotateKeys(p)} className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 text-xs hover:bg-amber-500/10">Rotate keys</button>
                <button onClick={() => deleteProject(p)} className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10">Delete project</button>
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
            <pre className="mt-5 p-4 rounded-xl bg-slate-900 border border-slate-800 text-[12px] leading-6 text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">{`<script src="https://bo-tshield.vercel.app/bot-shield.js"\n        data-api-key="${p.api_key}"></script>`}</pre>
          </motion.div>
        ))}
      </div>

      {/* Settings + integrations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-white">Settings</h2>
          <div><label className="block text-sm text-slate-400 mb-2">Change password</label>
            <div className="flex gap-3">
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} minLength={6} placeholder="New password" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" />
              <button onClick={changePass} className="px-5 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-sm text-white">Update</button>
            </div>
            {passMsg && <p className="text-xs text-emerald-400 mt-2">{passMsg}</p>}
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-white">Integrations & self-host</h2>
          <a href="https://github.com/brave290/bot-shield" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Github /><span className="text-sm text-slate-300">Self-host BotShield from GitHub</span></a>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Chip /><span className="text-sm text-slate-300">Supabase console (your data)</span></a>
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors"><Icons.Mail /><span className="text-sm text-slate-300">Resend (email delivery)</span></a>
        </div>
      </div>
    </main>

    {/* Slim footer: GitHub reference only */}
    <footer className="border-t border-slate-800/60 py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-600">© 2026 BotShield · BraveHX Studio</p>
        <a href="https://github.com/brave290/bot-shield" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors"><Icons.Github className="w-4 h-4" />View source on GitHub</a>
      </div>
    </footer>
  </>);
}
