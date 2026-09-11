"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { Icons, Footer, PageHero } from "@/components/site";
import { Navigation } from "@/components/Navigation";

const origin = "https://bo-tshield.vercel.app";
const examples = {
  website: `<script src="${origin}/bot-shield.js" data-api-key="bs_live_your_key" data-mode="modal"></script>\n\n<form data-botshield action="/signup" method="post">\n  <!-- BotShield adds bot_shield_token automatically -->\n</form>`,
  server: `const result = await fetch("${origin}/api/verify", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    secretKey: process.env.BOTSHIELD_SECRET,\n    token: request.body.bot_shield_token\n  })\n});\n\nconst { status } = await result.json();\nif (status !== "human") return denyRequest();`,
  api: `const challenge = await fetch("${origin}/api/challenge", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    apiKey: "bs_live_your_key",\n    mouseData: { distance: 240, time: 1800, curves: 12 },\n    typingData: { totalChars: 24, totalTime: 4200, backspaces: 1 },\n    fingerprint: "fp_example"\n  })\n});\nconst { token } = await challenge.json();`
};

const endpoints = [
  { method: "POST", path: "/api/challenge", desc: "Submit behavioral telemetry and receive a short-lived signed token.", params: ["apiKey", "mouseData", "typingData", "fingerprint"] },
  { method: "POST", path: "/api/verify", desc: "Verify a token server-to-server. Never send the secret key to the browser.", params: ["secretKey", "token"] },
  { method: "GET", path: "/api/stats/realtime", desc: "Read public aggregate network metrics and current plan pricing.", params: [] },
];

export default function ApiReferencePage() {
  const [caseId, setCaseId] = useState<keyof typeof examples>("website");
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(examples[caseId]); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (<><Navigation /><main><PageHero eyebrow="API Reference" title="Three ways to integrate." italic="One secure decision." subtitle="Use the widget for websites, server verification for forms, or the raw API for custom clients. All browser calls support CORS and origin controls." />
    <div className="mx-auto max-w-5xl space-y-12 px-6 pb-28">
      <section><div className="mb-4 flex flex-wrap gap-2">{(["website", "server", "api"] as const).map((id) => <button key={id} onClick={() => { setCaseId(id); setCopied(false); }} className={`rounded-lg px-4 py-2 text-sm ${caseId === id ? "bg-blue-600 text-white" : "border border-slate-700 text-slate-400 hover:text-white"}`}>{id === "website" ? "Website widget" : id === "server" ? "Backend verification" : "Raw challenge API"}</button>)}<button onClick={copy} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy example"}</button></div><pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950 p-6"><code className="font-mono text-sm leading-6 text-blue-300">{examples[caseId]}</code></pre><p className="mt-4 text-sm leading-relaxed text-slate-400">For each project, add allowed origins in the dashboard using the exact origin, including <code className="text-blue-300">https://</code>. Requests from an origin not on the list are rejected. Leave the list empty only if you intentionally allow all origins.</p></section>
      <section className="space-y-6"><h2 className="font-serif text-3xl font-bold text-white">Endpoint reference</h2>{endpoints.map((e, i) => <motion.div key={e.path} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .06 }} className="rounded-2xl border border-slate-800 bg-slate-950 p-7"><div className="mb-3 flex flex-wrap items-center gap-3"><span className={`rounded-md px-3 py-1 font-mono text-xs font-semibold ${e.method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>{e.method}</span><code className="font-mono text-sm text-white">{e.path}</code></div><p className="mb-5 leading-relaxed text-slate-400">{e.desc}</p>{e.params.length > 0 && <div className="flex flex-wrap gap-2">{e.params.map((p) => <code key={p} className="rounded bg-slate-900 px-2.5 py-1 text-xs text-slate-300">{p}</code>)}</div>}</motion.div>)}</section>
      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-7"><h2 className="mb-3 font-serif text-2xl font-bold text-white">Troubleshooting checklist</h2><ul className="space-y-2 text-sm leading-relaxed text-slate-400"><li><Icons.Check className="mr-2 inline text-emerald-400" />Use the hosted script URL, not a relative path on the customer website.</li><li><Icons.Check className="mr-2 inline text-emerald-400" />Pass the public key using <code className="text-blue-300">data-api-key</code>; the widget auto-starts in modal mode.</li><li><Icons.Check className="mr-2 inline text-emerald-400" />Verify <code className="text-blue-300">bot_shield_token</code> on your backend with the secret key.</li><li><Icons.Check className="mr-2 inline text-emerald-400" />Add the exact website origin to the project’s allowed-origin list.</li></ul></section>
    </div></main><Footer /></>);
}
