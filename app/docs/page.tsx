"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Footer, PageHero, Icons } from "@/components/site";

export default function DocsPage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const [active, setActive] = useState("quickstart");

  const sections = [
    { id: "quickstart", title: "Quickstart", body: "Add one script tag to any page. The widget automatically points at the domain that serves it, so this snippet keeps working when you move domains.", code: `<script\n  src="${origin}/bot-shield.js"\n  data-api-key="bs_live_your_key"\n></script>` },
    { id: "verify", title: "Server-side verification", body: "On form submission, read the hidden bot_shield_token field and verify it from your backend. Never trust the client's word.", code: `const res = await fetch("${origin}/api/verify", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ secretKey, token })\n});\nconst { status } = await res.json(); // "human" | blocked` },
    { id: "widget", title: "Widget API", body: "The widget scores visitors silently after ~4 seconds and injects a hidden token into your forms. You can also drive it manually.", code: `const token = window.botShield.getToken();\nwindow.botShield.refresh(); // re-score right now` },
    { id: "sensitivity", title: "Sensitivity presets", body: "Each project runs in strict, balanced, or loose mode. Strict is for checkout and auth. Loose is for comment sections with forgiving hearts.", code: `strict   → block at score ≥ 30\nbalanced → block at score ≥ 50\nloose    → block at score ≥ 80` },
    { id: "limits", title: "Rate limits", body: "Standard protections ship enabled and are editable live from the admin console.", code: `signups        5 / hour / IP\nlogins        10 / hour / IP\nverify calls 100 / min / key` },
    { id: "errors", title: "Error handling", body: "BotShield fails open by design. If our network is unreachable, your users are never locked out. Treat a network error as a pass and log it for review.", code: `try { await verify(); }\ncatch { allow(); logForReview(); }` },
    { id: "domains", title: "Domains & self-host", body: "The widget derives its API origin from its own script URL. Serve it from any domain today or tomorrow and it adapts with zero code changes. The core is open source under MIT.", code: `git clone https://github.com/brave290/bot-shield\ncd bot-shield\nnpm install && npm run dev` },
  ];

  return (<>
    <Navigation />
    <main>
      <PageHero eyebrow="Documentation" title="Read once," italic="integrate forever." subtitle="The entire integration surface fits on this page. Examples below are generated from the domain you are reading this on." />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28 grid lg:grid-cols-4 gap-10">
        <aside className="lg:col-span-1 min-w-0">
          <nav className="lg:sticky lg:top-28 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {sections.map((s) => (
              <button key={s.id} onClick={() => { setActive(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }} className={`px-4 py-2.5 rounded-lg text-sm whitespace-nowrap lg:whitespace-normal text-left transition-colors ${active === s.id ? "bg-blue-600/10 text-blue-400" : "text-slate-400 hover:text-white"}`}>
                {s.title}
              </button>
            ))}
          </nav>
        </aside>
        <div className="lg:col-span-3 space-y-10 min-w-0">
          {sections.map((s, i) => (
            <motion.section key={s.id} id={s.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-950">
              <h2 className="font-serif text-2xl font-semibold text-white mb-4">{s.title}</h2>
              <p className="text-slate-400 font-light leading-relaxed mb-6">{s.body}</p>
              <pre className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-[13px] leading-6 text-blue-300 font-mono overflow-x-auto whitespace-pre-wrap break-words">{s.code}</pre>
            </motion.section>
          ))}
        </div>
      </div>
    </main>
    <Footer />
  </>);
}
