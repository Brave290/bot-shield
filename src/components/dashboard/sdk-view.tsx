"use client";
import { useState } from "react";
import { Copy, Check, Shield, Code2, Globe2, Server, Braces } from "lucide-react";

interface SdkViewProps { publicKey: string; }
type Guide = "website" | "server" | "framework";

export function SdkView({ publicKey }: SdkViewProps) {
  const [guide, setGuide] = useState<Guide>("website");
  const [copied, setCopied] = useState(false);
  const key = publicKey || "bs_live_your_key";
  const baseUrl = "https://bo-tshield.vercel.app";
  const snippets: Record<Guide, string> = {
    website: `<script
  src="${baseUrl}/bot-shield.js"
  data-api-key="${key}"
  data-mode="modal"
></script>

<form data-botshield action="/signup" method="post">
  <!-- SDK injects bot_shield_token silently after scoring. -->
</form>

<script>
  // Optional: refresh before a sensitive action.
  window.BotShield.refresh();
</script>`,
    server: `// Node/Express example: keep BOTSHIELD_SECRET server-side.
const token = request.body.bot_shield_token;
if (!token) return response.status(400).json({ error: "missing_bot_shield_token" });

const verified = await fetch("${baseUrl}/api/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    secretKey: process.env.BOTSHIELD_SECRET,
    token
  })
});
const result = await verified.json();
if (result.status !== "human") return response.status(403).json({ error: "bot_blocked" });
return continueSignup();`,
    framework: `// Custom clients: challenge in the browser, verify on your backend.
const challenge = await fetch("${baseUrl}/api/challenge", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    apiKey: "${key}",
    mouseData: { distance: 850, time: 3200, curves: 24 },
    typingData: { totalChars: 42, totalTime: 9800, backspaces: 3 },
    fingerprint: "fp_from_your_client",
    deviceData: { webdriver: false, hardwareConcurrency: 8 },
    networkData: { connectionType: "4g", saveData: false }
  })
});
const { token } = await challenge.json();
// Send token to your server; never put BOTSHIELD_SECRET in this code.`
  };
  const guides = [
    { id: "website" as const, label: "Website widget", icon: Globe2, description: "Automatic telemetry, token injection, and optional status UI." },
    { id: "server" as const, label: "Backend verification", icon: Server, description: "The only place where the allow or deny decision is made." },
    { id: "framework" as const, label: "Raw API", icon: Braces, description: "For custom clients that collect their own multi-signal telemetry." },
  ];
  const copy = async () => { await navigator.clipboard.writeText(snippets[guide]); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="space-y-8">
      <div><h2 className="flex items-center gap-2 text-2xl font-bold text-white"><Code2 className="h-6 w-6 text-blue-500" /> SDK & API Integration</h2><p className="mt-2 text-slate-400">The SDK scores multiple signals. Your backend must verify every token before allowing a protected action.</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"><h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Your public key</h3><code className="block break-all rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm text-blue-400">{key}</code><p className="mt-3 text-xs text-slate-500">Safe in frontend code. Never expose the secret key, accept a client-supplied decision, or treat token presence as proof of humanity.</p></div>
      <div><h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Choose a guide</h3><div className="grid gap-4 md:grid-cols-3">{guides.map(({ id, label, icon: Icon, description }) => <button key={id} onClick={() => { setGuide(id); setCopied(false); }} className={`rounded-xl border p-4 text-left transition ${guide === id ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"}`}><Icon className={`mb-3 h-5 w-5 ${guide === id ? "text-blue-400" : "text-slate-500"}`} /><h4 className="font-semibold text-white">{label}</h4><p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p></button>)}</div></div>
      <div><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Copy-ready example</h3><button onClick={copy} className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700">{copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy guide"}</button></div><pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-6"><code className="font-mono text-sm text-slate-300">{snippets[guide]}</code></pre><div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs leading-relaxed text-slate-400"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" /><span>Use exact allowed origins, HTTPS in production, server-side verification, short-lived tokens, replay protection, rate limits, and shadow mode before blocking. Mouse movement is only one weak signal; BotShield also considers timing, typing, device automation flags, fingerprint continuity, and network hints.</span></div></div>
    </div>
  );
}
