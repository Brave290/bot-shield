"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Navigation } from "@/components/Navigation";
import { toast } from "@/components/toast";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminSettings() {
  const [masked, setMasked] = useState("");
  const [value, setValue] = useState("");

  const headers = async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token || ""}`, "Content-Type": "application/json" };
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/data?type=settings", { headers: await headers() });
      if (res.ok) { const d = await res.json(); setMasked(d.masked || ""); }
    })();
  }, []);

  const save = async () => {
    if (value.trim().length < 10) { toast("error", "That does not look like a Resend key"); return; }
    const res = await fetch("/api/admin/data", { method: "POST", headers: await headers(), body: JSON.stringify({ action: "save-setting", key: "resend_api_key", value: value.trim() }) });
    if (!res.ok) { toast("error", "Failed to save"); return; }
    toast("success", "Resend key saved. Contact emails are live now.");
    setValue("");
    const r2 = await fetch("/api/admin/data?type=settings", { headers: await headers() });
    if (r2.ok) setMasked((await r2.json()).masked || "");
  };

  return (<>
    <Navigation />
    <main className="pt-32 pb-28 max-w-3xl mx-auto px-6">
      <h1 className="font-serif text-4xl font-bold text-white mb-2">Platform settings</h1>
      <p className="text-slate-500 font-light mb-10">Runtime configuration. Changes apply instantly, no redeploy needed.</p>
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Resend API key</h2>
          <span className="text-xs text-slate-500">{masked ? `Current: ${masked}` : "Not configured"}</span>
        </div>
        <p className="text-xs text-slate-500 font-light">Get a key at resend.com. Once saved, every contact form submission is emailed to info.bravehx@gmail.com and stored in the admin console.</p>
        <input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="re_..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500/60" />
        <button onClick={save} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Save key</button>
      </div>
    </main>
  </>);
}
