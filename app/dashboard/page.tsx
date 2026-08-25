"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons, Footer, MotionLink } from "@/components/site";
import { Navigation } from "@/components/Navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const gen = (p: string) => p + Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");

  const load = async (uid: string) => {
    const { data } = await supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    setProjects(data || []);
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
    if (!user || name.trim().length < 2) return;
    const { error } = await supabase.from("projects").insert({ user_id: user.id, name: name.trim(), api_key: gen("bs_live_"), secret_key: gen("bs_sec_") });
    if (!error) { setName(""); await load(user.id); }
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 1500);
  };

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setProjects([]); };

  if (loading) return <div className="min-h-screen bg-slate-950" />;

  if (!user) {
    return (<>
      <Navigation />
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold text-white mb-4">Your dashboard awaits.</h1>
          <p className="text-slate-400 font-light mb-8">Sign in to create projects and get your API keys.</p>
          <MotionLink href="/login" whileHover={{ scale: 1.04 }} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Go to login<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
        </div>
      </main>
      <Footer />
    </>);
  }

  return (<>
    <Navigation />
    <main className="pt-32 pb-28 max-w-5xl mx-auto px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="font-serif text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 font-light mt-1">{user.email}</p>
        </div>
        <button onClick={signOut} className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-sm text-slate-300">Sign out</button>
      </div>

      <form onSubmit={createProject} className="p-6 rounded-2xl border border-slate-800 bg-slate-950 mb-10 flex flex-col sm:flex-row gap-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name (e.g. my-shop)" className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" />
        <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Create project</button>
      </form>

      {projects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-500 font-light">No projects yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-xl font-semibold text-white">{p.name}</h2>
                <span className="text-xs text-emerald-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-xs text-blue-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono break-all">{p.api_key}</code>
                  <button onClick={() => copy(p.api_key, p.id + "a")} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500">{copied === p.id + "a" ? "Copied" : "Copy"}</button>
                </div>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono break-all">{revealed[p.id] ? p.secret_key : "bs_sec_••••••••••••••••••••"}</code>
                  <button onClick={() => setRevealed({ ...revealed, [p.id]: !revealed[p.id] })} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500">{revealed[p.id] ? "Hide" : "Reveal"}</button>
                  <button onClick={() => copy(p.secret_key, p.id + "s")} className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500">{copied === p.id + "s" ? "Copied" : "Copy"}</button>
                </div>
              </div>
              <pre className="mt-5 p-4 rounded-xl bg-slate-900 border border-slate-800 text-[12px] leading-6 text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">{`<script src="https://bo-tshield.vercel.app/bot-shield.js"\n        data-api-key="${p.api_key}"></script>`}</pre>
            </motion.div>
          ))}
        </div>
      )}
    </main>
    <Footer />
  </>);
}
