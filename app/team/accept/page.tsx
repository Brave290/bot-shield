"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ShieldCheck } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export default function AcceptTeamInvitePage() {
  const params = useSearchParams(); const router = useRouter(); const [message, setMessage] = useState("Checking your invitation…");
  useEffect(() => { (async () => { const inviteToken = params.get("token"); if (!inviteToken) { setMessage("Invitation token is missing."); return; } const { data } = await supabase.auth.getSession(); if (!data.session) { router.push(`/login?next=/team/accept?token=${encodeURIComponent(inviteToken)}`); return; } const response = await fetch("/api/team/accept", { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ inviteToken }) }); const result = await response.json().catch(() => null); if (!response.ok) { setMessage(result?.error || "Unable to accept invitation."); return; } setMessage("Invitation accepted. Your project access is ready."); setTimeout(() => router.push(`/dashboard/${result.projectId}`), 1200); })(); }, [params, router]);
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6"><div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400"><ShieldCheck className="h-7 w-7" /></div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">BotShield team access</p><h1 className="font-serif text-3xl font-bold text-white">Join the workspace</h1><p className="mt-4 text-sm leading-relaxed text-slate-400">{message}</p></div></main>;
}
