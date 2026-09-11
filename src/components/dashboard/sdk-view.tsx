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
    website: `<script\n  src="${baseUrl}/bot-shield.js"\n  data-api-key="${key}"\n  data-mode="modal"\n></script>\n\n<form data-botshield action="/signup" method="post">\n  <!-- BotShield adds bot_shield_token here after verification -->\n</form>`,
    server: `const challenge = await fetch("${baseUrl}/api/challenge", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    apiKey: "${key}",\n    mouseData: { distance: 240, time: 1800, curves: 12 },\n    typingData: { totalChars: 24, totalTime: 4200, backspaces: 1 },\n    fingerprint: "fp_example"\n  })\n});\nconst { token } = await challenge.json();\n\nconst verified = await fetch("${baseUrl}/api/verify", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ secretKey: process.env.BOTSHIELD_SECRET, token })\n});`,
    framework: `// Next.js, Express, Laravel, Django, Rails, or any backend\nconst response = await fetch("${baseUrl}/api/verify", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    secretKey: process.env.BOTSHIELD_SECRET,\n    token: request.body.bot_shield_token\n  })\n});\n\nconst result = await response.json();\nif (result.status !== "human") return denyRequest();\nreturn allowRequest();`
  };

  const guides = [
    { id: "website" as const, label: "Website widget", icon: Globe2, description: "One script tag with automatic branded verification." },
    { id: "server" as const, label: "Raw API", icon: Server, description: "Call challenge and verify directly from your own stack." },
    { id: "framework" as const, label: "Framework backend", icon: Braces, description: "Verify the hidden token in Next.js, Express, Laravel, Django, or Rails." },
  ];
  const copy = async () => { await navigator.clipboard.writeText(snippets[guide]); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white"><Code2 className="h-6 w-6 text-blue-500" /> SDK & API Integration</h2>
        <p className="mt-2 text-slate-400">Choose a use case, copy the example, then verify every token on your server.</p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Your public key</h3>
        <code className="block break-all rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm text-blue-400">{key}</code>
        <p className="mt-3 text-xs text-slate-500">Safe in frontend code. Keep the secret key on your server only.</p>
      </div>
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Choose a guide</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {guides.map(({ id, label, icon: Icon, description }) => (
            <button key={id} onClick={() => { setGuide(id); setCopied(false); }} className={`rounded-xl border p-4 text-left transition ${guide === id ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20" : "border-slate-800 bg-slate-900/50 hover:border-slate-700"}`}>
              <Icon className={`mb-3 h-5 w-5 ${guide === id ? "text-blue-400" : "text-slate-500"}`} />
              <h4 className="font-semibold text-white">{label}</h4><p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Copy-ready example</h3><button onClick={copy} className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700">{copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}{copied ? "Copied" : "Copy guide"}</button></div>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-6"><code className="font-mono text-sm text-slate-300">{snippets[guide]}</code></pre>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs leading-relaxed text-slate-400"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" /><span>Set your project’s allowed origins to the exact scheme and host, for example <code className="text-blue-300">https://shop.example.com</code>. Local development can use <code className="text-blue-300">http://localhost:3000</code>.</span></div>
      </div>
    </div>
  );
}
