"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Icons, Navigation, Footer, PageHero } from "@/components/site";

const sections = [
  { id: "quickstart", title: "Quickstart", body: "Add the widget to any page. It works with plain HTML, React, Vue, Svelte, or a 2009-era PHP template. If it renders HTML, it works.", code: '<script\n  src="https://cdn.botshield.dev/widget.js"\n  data-api-key="bs_live_your_key"\n  data-api-url="https://api.botshield.dev"\n></script>' },
  { id: "verify", title: "Server-side verification", body: "On form submission, read the hidden bot_shield_token field and verify it from your backend. Never trust the client's word.", code: 'const res = await fetch("https://api.botshield.dev/api/verify", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ secretKey, token })\n});\nconst { status } = await res.json(); // "human" | blocked' },
  { id: "sensitivity", title: "Sensitivity presets", body: "Each project can run in strict, balanced, or loose mode. Strict is for checkout flows and auth. Loose is for comment sections with forgiving hearts.", code: 'strict   → block at score ≥ 30\nbalanced → block at score ≥ 50\nloose    → block at score ≥ 80' },
  { id: "errors", title: "Error handling", body: "The API fails open by design. If our network is unreachable, your users should never be locked out. Treat a network error as a pass, and log it for review.", code: 'try { verify() } catch { allow(); logForReview(); }' },
];

export default function DocsPage() {
  const [active, setActive] = useState("quickstart");
  return (
    <>
      <Navigation />
      <main>
        <PageHero eyebrow="Documentation" title="Read once," italic="integrate forever." subtitle="The entire integration surface fits on this page. That is not a marketing claim, that is the API design philosophy." />
        <div className="max-w-6xl mx-auto px-6 pb-28 grid lg:grid-cols-4 gap-10">
          <aside className="lg:col-span-1">
            <nav className="lg:sticky lg:top-28 space-y-1">
              {sections.map((s) => (
                <button key={s.id} onClick={() => { setActive(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }} className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${active === s.id ? "bg-blue-600/10 text-blue-400" : "text-slate-400 hover:text-white"}`}>
                  {s.title}
                </button>
              ))}
            </nav>
          </aside>
          <div className="lg:col-span-3 space-y-10">
            {sections.map((s, i) => (
              <motion.section key={s.id} id={s.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-8 rounded-2xl border border-slate-800 bg-slate-950">
                <h2 className="font-serif text-2xl font-semibold text-white mb-4">{s.title}</h2>
                <p className="text-slate-400 font-light leading-relaxed mb-6">{s.body}</p>
                <pre className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-[13px] leading-6 text-blue-300 font-mono overflow-x-auto whitespace-pre-wrap">{s.code}</pre>
              </motion.section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
