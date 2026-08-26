"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "@/components/Navigation";
import { BrandLoader } from "@/components/loader";
import { toast } from "@/components/toast";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function headers() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: "Bearer " + (data.session?.access_token || ""), "Content-Type": "application/json" };
}

export default function RateLimits() {
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/admin/data?type=rate_limits", { headers: await headers() });
    if (res.ok) setLimits(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (l: any) => {
    const res = await fetch("/api/admin/data", { method: "POST", headers: await headers(), body: JSON.stringify({ action: "save-rate-limit", ...l }) });
    if (res.ok) toast("success", "Rate limit updated");
    else toast("error", "Failed to update");
  };

  if (loading) return (<><Navigation /><BrandLoader /></>);

  return (<>
    <Navigation />
    <main className="pt-28 pb-24 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
      <h1 className="font-serif text-4xl font-bold text-white">Rate limits</h1>
      <p className="text-sm text-slate-500 font-light">Global thresholds for the platform. Per-project overrides are in Project Rules.</p>
      <div className="space-y-4">
        {limits.map((l) => (
          <div key={l.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold font-mono text-sm">{l.endpoint}</h2>
              <span className="text-xs text-slate-500">Scope: {l.scope}</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-2">Max attempts</label>
                <input type="number" defaultValue={l.max_attempts} onBlur={(e) => save({ ...l, max_attempts: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-2">Window (seconds)</label>
                <input type="number" defaultValue={l.window_seconds} onBlur={(e) => save({ ...l, window_seconds: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-2">Enabled</label>
                <select defaultValue={l.enabled ? "true" : "false"} onChange={(e) => save({ ...l, enabled: e.target.value === "true" })} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        {limits.length === 0 && <p className="text-slate-500 text-sm">No global rate limits configured.</p>}
      </div>
    </main>
  </>);
}
