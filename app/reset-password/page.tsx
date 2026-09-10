"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Footer, Icons } from "@/components/site";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    supabase.auth.getSession().then(({ data: session }) => {
      if (session.session) setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const requestReset = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (resetError) setError(resetError.message);
    else setMessage("If an account exists for that email, a password reset link is on its way.");
    setBusy(false);
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    if (password.length < 8) { setError("Use at least 8 characters."); setBusy(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else { setMessage("Password updated. You can now sign in."); setTimeout(() => router.push("/login"), 1200); }
    setBusy(false);
  };

  return (<><Navigation /><main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16"><div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-8"><div className="text-center mb-8"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white"><Icons.Shield className="h-6 w-6" /></div><h1 className="font-serif text-3xl font-bold text-white">{recovery ? "Choose a new password." : "Reset your password."}</h1><p className="mt-2 text-sm text-slate-500">{recovery ? "Use a strong password you do not reuse elsewhere." : "We will send a secure recovery link to your inbox."}</p></div><form onSubmit={recovery ? updatePassword : requestReset} className="space-y-4">{recovery ? <div><label htmlFor="new-password" className="mb-2 block text-sm text-slate-400">New password</label><input id="new-password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/60" /></div> : <div><label htmlFor="reset-email" className="mb-2 block text-sm text-slate-400">Email</label><input id="reset-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/60" placeholder="you@company.com" /></div>}{error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}{message && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}<button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3.5 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">{busy ? "Please wait..." : recovery ? "Update password" : "Send reset link"}</button></form>{!recovery && <button onClick={() => router.push("/login")} className="mt-6 w-full text-center text-sm text-blue-400 hover:text-blue-300">Back to sign in</button>}</div></main><Footer /></>);
}
