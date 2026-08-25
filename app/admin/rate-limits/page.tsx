"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons, Footer } from "@/components/site";
import { Navigation } from "@/components/Navigation";
import { BrandLoader } from "@/components/loader";
import { toast } from "@/components/toast";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface RateLimit { id: string; endpoint: string; window_seconds: number; max_attempts: number; scope: string; enabled: boolean; description: string; }

export default function RateLimitsAdmin() {
  const [limits, setLimits] = useState<RateLimit[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "denied">("loading");

  const headers = async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" };
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/rate-limits", { headers: await headers() });
      if (res.status === 403) { setState("denied"); return; }
      setLimits(await res.json());
      setState("ready");
    })();
  }, []);

  const update = async (id: string, updates: Partial<RateLimit>) => {
    const res = await fetch("/api/admin/rate-limits", { method: "PATCH", headers: await headers(), body: JSON.stringify({ id, ...updates }) });
    if (!res.ok) { toast("error", "Failed to update"); return; }
    const updated = await res.json();
    setLimits((prev) => prev.map((l) => (l.id === id ? updated : l)));
    toast("success", "Rate limit updated live");
  };

  if (state === "denied") return (<><Navigation /><main className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Admins only. <a href="/login" className="text-blue-400">Sign in</a>.</p></main></>);
  if (state === "loading") return (<><Navigation /><BrandLoader /></>);

  return (<>
    <Navigation />
    <main className="pt-32 pb-28 max-w-6xl mx-auto px-6">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold text-white mb-2">Rate Limits</h1>
        <p className="text-slate-500 font-light">Configure protection thresholds. Changes apply instantly.</p>
      </div>
      <div className="space-y-4">
        {limits.map((limit) => (
          <motion.div key={limit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-slate-800 bg-slate-950">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <code className="text-sm text-blue-400 font-mono">{limit.id}</code>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs">{limit.scope}</span>
                </div>
                <p className="text-sm text-slate-500 font-light">{limit.description}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-500">{limit.enabled ? "Enabled" : "Disabled"}</span>
                <input type="checkbox" checked={limit.enabled} onChange={(e) => update(limit.id, { enabled: e.target.checked })} className="w-4 h-4" />
              </label>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="block text-xs text-slate-500 mb-2">Max attempts</label><input type="number" defaultValue={limit.max_attempts} onBlur={(e) => update(limit.id, { max_attempts: parseInt(e.target.value) || 0 })} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60" /></div>
              <div><label className="block text-xs text-slate-500 mb-2">Window (seconds)</label><input type="number" defaultValue={limit.window_seconds} onBlur={(e) => update(limit.id, { window_seconds: parseInt(e.target.value) || 0 })} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60" /></div>
              <div><label className="block text-xs text-slate-500 mb-2">Endpoint</label><code className="block bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono">{limit.endpoint}</code></div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
    <Footer />
  </>);
}
