"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "@/components/Navigation";
import { toast } from "@/components/toast";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminSettings() {
  const [masked, setMasked] = useState("");
  const [value, setValue] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [ip, setIp] = useState("");

  const headers = async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" };
  };

  const load = async () => {
    const res = await fetch("/api/admin/data?type=settings", { headers: await headers() });
    if (res.ok) { const d = await res.json(); setMasked(d.masked || ""); setMaintenance(!!d.maintenance); setIp(d.ip || ""); }
  };
  useEffect(() => { load(); }, []);

  const saveKey = async () => {
    if (value.trim().length < 10) { toast("error", "That does not look like a Resend key"); return; }
    const res = await fetch("/api/admin/data", { method: "POST", headers: await headers(), body: JSON.stringify({ action: "save-setting", key: "resend_api_key", value: value.trim() }) });
    if (!res.ok) { toast("error", "Failed to save"); return; }
    toast("success", "Resend key saved. Contact emails are live.");
    setValue(""); load();
  };

  const toggleMaintenance = async () => {
    const next = !maintenance;
    const res = await fetch("/api/admin/data", { method: "POST", headers: await headers(), body: JSON.stringify({ action: "save-setting", key: "maintenance_mode", value: next ? "on" : "off" }) });
    if (!res.ok) { toast("error", "Failed to update"); return; }
    setMaintenance(next);
    toast(next ? "error" : "success", next ? "Maintenance mode ON — public site is down for visitors" : "Maintenance mode OFF — site is live");
  };

  const testEmail = async () => {
    const res = await fetch("/api/admin/data", { method: "POST", headers: await headers(), body: JSON.stringify({ action: "test-email" }) });
    const d = await res.json();
    if (!res.ok) { toast("error", d.error || "Failed to send"); return; }
    toast("success", "Test email sent - check your inbox");
  };

  return (<>
    <Navigation />
    <main className="pt-32 pb-28 max-w-3xl mx-auto px-6 space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-bold text-white mb-2">Platform settings</h1>
        <p className="text-slate-500 font-light">Runtime configuration. Changes apply instantly, no redeploy.</p>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
        <h2 className="text-white font-semibold">Your connection</h2>
        <p className="text-xs text-slate-500 font-light">Your current public IP. Copy it into a project's whitelist to always allow yourself.</p>
        <div className="flex gap-3">
          <code className="flex-1 text-sm text-blue-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 font-mono break-all">{ip || "detecting..."}</code>
          <button onClick={async () => { await navigator.clipboard.writeText(ip); toast("success", "IP copied"); }} className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:border-slate-500">Copy</button>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
        <div className="flex items-center justify-between">
          <div><h2 className="text-white font-semibold">Maintenance mode</h2><p className="text-xs text-slate-500 font-light mt-1">Takes the public site offline for everyone except /admin and /login.</p></div>
          <button onClick={toggleMaintenance} className={`px-5 py-2.5 rounded-xl text-sm font-medium ${maintenance ? "bg-red-600 hover:bg-red-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}>{maintenance ? "ON — site down" : "OFF — site live"}</button>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Resend API key</h2>
          <span className="text-xs text-slate-500">{masked ? `Current: ${masked}` : "Not configured"}</span>
        </div>
        <input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="re_..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500/60" />
        <button onClick={saveKey} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Save key</button>
        <button onClick={testEmail} className="px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 text-sm font-medium">Send test email</button>
      </div>
    </main>
  </>);
}
