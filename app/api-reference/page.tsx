"use client";
"use client";
import { motion } from "framer-motion";
import { Navigation, Footer, PageHero } from "@/components/site";

const endpoints = [
  { method: "POST", path: "/api/challenge", desc: "Submit behavioral telemetry and receive a signed pass token, or a 403 block.", params: [["apiKey", "string", "Your public project key"], ["mouseData", "object", "distance, time, curves"], ["typingData", "object", "totalChars, totalTime, backspaces"], ["fingerprint", "string", "Canvas-derived hash"]] },
  { method: "POST", path: "/api/verify", desc: "Server-to-server token verification. The only call your backend needs.", params: [["secretKey", "string", "Your private project key"], ["token", "string", "JWT issued by /challenge"]] },
  { method: "GET", path: "/api/stats/realtime", desc: "Live network metrics and subscription distribution. Powers this site's own stats.", params: [] },
  { method: "POST", path: "/api/track-visitor", desc: "Registers a unique daily visitor using a SHA-256 hashed IP. Idempotent per day.", params: [] },
];

export default function ApiReferencePage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHero eyebrow="API Reference" title="Four endpoints." italic="That's the whole API." subtitle="Small surfaces are secure surfaces. Every endpoint is rate-limited, validated, and logged." />
        <div className="max-w-4xl mx-auto px-6 pb-28 space-y-6">
          {endpoints.map((e, i) => (
            <motion.div key={e.path} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="p-8 rounded-2xl border border-slate-800 bg-slate-950">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-md text-xs font-semibold font-mono ${e.method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>{e.method}</span>
                <code className="text-white font-mono text-sm">{e.path}</code>
              </div>
              <p className="text-slate-400 font-light leading-relaxed mb-6">{e.desc}</p>
              {e.params.length > 0 && (
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-900/60 text-left"><th className="p-4 text-slate-400 font-medium">Parameter</th><th className="p-4 text-slate-400 font-medium">Type</th><th className="p-4 text-slate-400 font-medium">Description</th></tr></thead>
                    <tbody className="divide-y divide-slate-800">
                      {e.params.map(([n, t, d]) => (
                        <tr key={n}><td className="p-4 font-mono text-blue-300 text-xs">{n}</td><td className="p-4 text-slate-500 font-mono text-xs">{t}</td><td className="p-4 text-slate-400 font-light">{d}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
