"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Icons, Footer } from "@/components/site";
import { Navigation } from "@/components/Navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else router.push("/dashboard");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else if (data.session) router.push("/dashboard");
      else setMsg("Account created. Check your email to confirm, then sign in.");
    }
    setBusy(false);
  };

  return (<>
    <Navigation />
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-slate-950 to-slate-950" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-950">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4"><Icons.Shield className="w-6 h-6" /></div>
            <h1 className="font-serif text-3xl font-bold text-white">{mode === "signin" ? "Welcome back." : "Create your account."}</h1>
            <p className="text-sm text-slate-500 font-light mt-2">{mode === "signin" ? "Sign in to manage your projects." : "Start protecting your apps in minutes."}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="block text-sm text-slate-400 mb-2">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" placeholder="you@company.com" /></div>
            <div><label className="block text-sm text-slate-400 mb-2">Password</label><input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" placeholder="Minimum 6 characters" /></div>
            {msg && <p className="text-sm text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">{msg}</p>}
            <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium">{busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === "signin" ? "New to BotShield?" : "Already have an account?"}{" "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }} className="text-blue-400 hover:text-blue-300">{mode === "signin" ? "Create an account" : "Sign in"}</button>
          </p>
        </div>
      </motion.div>
    </main>
    <Footer />
  </>);
}
