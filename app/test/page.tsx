"use client";
import { useState, useEffect } from "react";
import { Navigation, Footer } from "@/components/site";

type LogLine = { t: string; kind: "in" | "ok" | "err" };

export default function TestPage() {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [token, setToken] = useState("");
  const [log, setLog] = useState<LogLine[]>([]);

  const push = (kind: LogLine["kind"], t: string) => setLog((l) => [...l, { kind, t }]);

  useEffect(() => {
    fetch("/api/demo-keys")
      .then((r) => r.json())
      .then((d) => { if (d.apiKey) { setApiKey((k) => k || d.apiKey); setSecretKey((k) => k || d.secretKey); } })
      .catch(() => {});
  }, []);

  const challenge = async (label: string, payload: unknown) => {
    push("in", "POST /api/challenge — " + label);
    try {
      const res = await fetch("/api/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      push(res.ok ? "ok" : "err", "status " + res.status + " · " + JSON.stringify(data));
      if (data.token) { setToken(data.token); push("ok", "Token stored. Hit 'Verify last token' to check it server-side."); }
    } catch (e) { push("err", "network error: " + String(e)); }
  };

  const human = () => challenge("HUMAN behavior", {
    apiKey,
    mouseData: { distance: 842, time: 1930, curves: 14, pauses: 3 },
    typingData: { totalChars: 26, totalTime: 4200, backspaces: 2 },
    fingerprint: "fp-human-" + Math.random().toString(36).slice(2),
  });

  const bot = () => challenge("BOT behavior", {
    apiKey,
    mouseData: { distance: 500, time: 12, curves: 0, pauses: 0 },
    typingData: { totalChars: 26, totalTime: 40, backspaces: 0 },
    fingerprint: "fp-bot-" + Math.random().toString(36).slice(2),
  });

  const verify = async () => {
    if (!token || !secretKey) { push("err", "Need a passed token + your bs_sec_ secret key"); return; }
    push("in", "POST /api/verify (server-to-server)");
    const res = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secretKey, token }) });
    const data = await res.json();
    push(res.ok ? "ok" : "err", "status " + res.status + " · " + JSON.stringify(data));
  };

  const loadWidget = () => {
    if (!apiKey) { push("err", "Paste your bs_live_ key first"); return; }
    const s = document.createElement("script");
    s.src = "/bot-shield.js";
    s.setAttribute("data-api-key", apiKey);
    document.body.appendChild(s);
    push("ok", "Live widget injected into this page. Open the browser console to watch it analyze you.");
  };

  return (<>
    <Navigation />
    <main className="pt-32 pb-28 max-w-4xl mx-auto px-6">
      <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">API playground</h1>
      <p className="text-slate-400 font-light mb-10">Fire real requests at your own BotShield API and watch it judge humans vs bots, live.</p>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4 mb-6">
        <div><label className="block text-sm text-slate-400 mb-2">Public API key (bs_live_...)</label>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500/60" placeholder="bs_live_..." /></div>
        <div><label className="block text-sm text-slate-400 mb-2">Secret key (bs_sec_...) — used only for verify</label>
          <input value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-blue-500/60" placeholder="bs_sec_..." /></div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <button onClick={human} className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-left transition-colors">
          <h3 className="text-emerald-400 font-semibold mb-1">Simulate human</h3>
          <p className="text-xs text-slate-500 font-light">Curved mouse paths, natural typing speed, small mistakes.</p>
        </button>
        <button onClick={bot} className="p-5 rounded-2xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-left transition-colors">
          <h3 className="text-red-400 font-semibold mb-1">Simulate bot</h3>
          <p className="text-xs text-slate-500 font-light">Instant linear movement, inhuman typing speed, zero errors.</p>
        </button>
        <button onClick={verify} className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-left transition-colors">
          <h3 className="text-blue-400 font-semibold mb-1">Verify last token</h3>
          <p className="text-xs text-slate-500 font-light">Server-to-server check, exactly like your backend would do.</p>
        </button>
        <button onClick={loadWidget} className="p-5 rounded-2xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 text-left transition-colors">
          <h3 className="text-white font-semibold mb-1">Load live widget</h3>
          <p className="text-xs text-slate-500 font-light">Injects bot-shield.js on this page with your key. Watch the console.</p>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 text-xs text-slate-500 font-mono">live request log</div>
        <div className="p-5 space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
          {log.length === 0 && <p className="text-slate-600">No requests yet. Paste your keys from the dashboard, then simulate a human.</p>}
          {log.map((l, i) => (
            <p key={i} className={l.kind === "ok" ? "text-emerald-400" : l.kind === "err" ? "text-red-400" : "text-blue-300"}>{l.t}</p>
          ))}
        </div>
      </div>
    </main>
    <Footer />
  </>);
}
