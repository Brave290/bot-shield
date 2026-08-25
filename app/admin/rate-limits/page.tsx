"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Icons, Footer } from "@/components/site";
import { Navigation } from "@/components/Navigation";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RateLimit {
  id: string;
  endpoint: string;
  window_seconds: number;
  max_attempts: number;
  scope: string;
  enabled: boolean;
  description: string;
}

export default function RateLimitsAdmin() {
  const [limits, setLimits] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabaseAdmin.from("rate_limits").select("*").order("id");
      setLimits(data || []);
      setLoading(false);
    })();
  }, []);

  const update = async (id: string, updates: Partial<RateLimit>) => {
    setSaving(id);
    await supabaseAdmin.from("rate_limits").update(updates).eq("id", id);
    setLimits(limits.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    setTimeout(() => setSaving(null), 500);
  };

  if (loading) return <div className="min-h-screen bg-slate-950" />;

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
              <div>
                <label className="block text-xs text-slate-500 mb-2">Max attempts</label>
                <input type="number" value={limit.max_attempts} onChange={(e) => update(limit.id, { max_attempts: parseInt(e.target.value) || 0 })} disabled={saving === limit.id} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-2">Window (seconds)</label>
                <input type="number" value={limit.window_seconds} onChange={(e) => update(limit.id, { window_seconds: parseInt(e.target.value) || 0 })} disabled={saving === limit.id} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-2">Endpoint</label>
                <code className="block bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono">{limit.endpoint}</code>
              </div>
            </div>

            {saving === limit.id && (
              <div className="mt-4 text-xs text-emerald-400 flex items-center gap-2">
                <Icons.Check className="w-3 h-3" /> Updated
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </main>
    <Footer />
  </>);
}
