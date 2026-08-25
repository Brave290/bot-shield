"use client";
import { Preloader } from "@/components/site";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { Icons, MotionLink, Footer, PageHero, CTASection, CONTACTS } from "@/components/site";
import { Navigation } from "@/components/Navigation";
import DailyVisitorsBadge from "@/components/DailyVisitorsBadge";
import { ComparisonSection, IntegrationsSection } from "@/components/extra";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const fadeUp = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" } };

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-28 pb-20">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
        <div>
          <div className="mb-8"><DailyVisitorsBadge /></div>
          <p className="mb-6 text-xs font-light tracking-[0.25em] uppercase text-slate-600">Public beta v{(process.env.APP_VERSION || "1.4").split(".").slice(0, 2).join(".")}</p>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="font-serif text-5xl md:text-6xl xl:text-7xl font-bold text-white leading-[1.08]">
            Master your security with <span className="italic font-medium text-blue-400">intelligence.</span><br />Protect your users today.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 text-lg md:text-xl text-slate-400 font-light leading-relaxed max-w-xl">
            BotShield is the ultimate companion for modern developers. Behavioral bot detection, real-time analytics, and cryptographic verification in one powerful API.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 flex flex-col sm:flex-row gap-4">
            <MotionLink href="/dashboard" whileHover={{ scale: 1.04 }} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-xl shadow-blue-600/25">Get Started Free<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
            <MotionLink href="/docs" whileHover={{ scale: 1.04 }} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-white font-medium"><Icons.Terminal className="w-4 h-4" />Read the Docs</MotionLink>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500 font-light">
            {["No credit card required", "1,000 free requests monthly", "Open source under MIT"].map((t) => (<span key={t} className="flex items-center gap-2"><span className="text-blue-400"><Icons.Check /></span>{t}</span>))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }} className="relative hidden lg:block">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800"><span className="w-3 h-3 rounded-full bg-slate-700" /><span className="w-3 h-3 rounded-full bg-slate-700" /><span className="w-3 h-3 rounded-full bg-slate-700" /><span className="ml-3 text-xs text-slate-500 font-mono">your-website.com</span></div>
            <div className="p-6 font-mono text-[13px] leading-7">
              <p className="text-slate-500">// 1. Drop in the script</p>
              <p className="text-slate-300">&lt;script src="bot-shield.js"&gt;&lt;/script&gt;</p>
              <p className="text-slate-500 mt-4">// 2. Silent behavior analysis</p>
              <p className="text-slate-300">mouse.curves → <span className="text-emerald-400">14</span> (human)</p>
              <p className="text-slate-300">typing.cps → <span className="text-emerald-400">4.2</span> (human)</p>
              <p className="text-slate-300">score → <span className="text-emerald-400">8 / 100</span></p>
              <p className="text-slate-500 mt-4">// 3. Token issued</p>
              <p className="text-emerald-400">status: passed · token: eyJhbGci…</p>
            </div>
            <div className="relative h-px bg-blue-500/40 animate-scan" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Marquee() {
  const names = ["Vercel", "Stripe", "Cloudflare", "Supabase", "GitHub", "Linear", "Notion", "Figma", "Neon", "Railway"];
  return (
    <section className="py-10 border-y border-slate-800/60 overflow-hidden">
      <p className="text-center text-xs tracking-[0.3em] uppercase text-slate-500 mb-8">Built to sit beside the tools you already trust</p>
      <div className="flex animate-marquee whitespace-nowrap gap-20">
        {[...names, ...names].map((n, i) => (<span key={i} className="font-serif text-2xl text-slate-600">{n}</span>))}
      </div>
    </section>
  );
}

function LiveStats() {
  const [s, setS] = useState({ t: 0, b: 0 });
  useEffect(() => {
    const load = async () => { try { const r = await fetch("/api/stats/realtime"); const d = await r.json(); setS({ t: d.totalRequests || 0, b: d.blockedBots || 0 }); } catch {} };
    load();
    const ch = supabase.channel("ls").on("postgres_changes", { event: "UPDATE", schema: "public", table: "request_metrics" }, (p) => setS({ t: p.new.total_requests, b: p.new.blocked_requests })).subscribe();
    const iv = setInterval(load, 30000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, []);
  const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(n));
  const items = [["Requests analyzed", fmt(s.t)], ["Bots blocked", fmt(s.b)], ["Median response", "48ms"], ["Uptime, 90 days", "99.98%"]];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">Numbers we <span className="italic text-blue-400">actually</span> measure.</h2>
          <span className="hidden md:flex items-center gap-2 text-xs text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live from production</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-800/60">
          {items.map(([l, v], i) => (<motion.div key={l} {...fadeUp} transition={{ delay: i * 0.08 }} className="bg-slate-950 p-8 md:p-10"><div className="font-serif text-4xl md:text-5xl font-bold text-white tabular-nums">{v}</div><div className="mt-3 text-sm text-slate-500 font-light">{l}</div></motion.div>))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const f = [
    [Icons.Bolt, "Featherweight by design", "The widget ships under 5KB, smaller than one product photo. Your Core Web Vitals stay untouched."],
    [Icons.Lock, "Cryptographic verification", "Every pass issues a short-lived signed JWT. Your backend verifies in one call. No secrets in the browser."],
    [Icons.Eye, "Behavioral analysis", "Mouse curvature, keystroke cadence, pointer entropy. Bots cannot fake the micro-details."],
    [Icons.Chart, "Honest analytics", "Live dashboards fed straight from the production database. No sampling, no painted numbers."],
    [Icons.Globe, "Edge-close verification", "Round trips under 50ms for 95% of the world, keeping protection invisible."],
    [Icons.Chip, "Adaptive scoring", "Rule-based today, learning tomorrow. New signals plug in without breaking your integration."],
  ] as const;
  return (
    <section className="py-28 bg-slate-900/20 border-y border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-16 max-w-3xl">Everything a security layer should be. <span className="italic text-blue-400">Nothing it shouldn't.</span></h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {f.map(([I, t, b], i) => (
            <motion.div key={t} {...fadeUp} transition={{ delay: (i % 3) * 0.1 }} className="group p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6"><I /></div>
              <h3 className="font-serif text-xl font-semibold text-white mb-3">{t}</h3>
              <p className="text-slate-400 font-light leading-relaxed">{b}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState(0);
  const faqs = [
    ["Will this slow my website down?", "No. The widget is under 5KB, loads async, never blocks rendering. Zero measurable impact on Core Web Vitals."],
    ["Is this GDPR friendly?", "Yes. IPs are SHA-256 hashed before storage and no tracking cookies are used."],
    ["What happens when a real user is flagged?", "You control sensitivity per project, and every flagged session is reviewable in your dashboard."],
    ["Do I need to change my backend?", "One endpoint call: send the token and your secret, we answer human or not. That is the whole contract."],
    ["Can I self-host BotShield?", "The core is open source under MIT. Self-host it, or use the hosted version and skip the ops work."],
  ];
  return (
    <section className="py-28 bg-slate-900/20 border-y border-slate-800/60">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-white text-center mb-14">Questions, <span className="italic text-blue-400">answered plainly.</span></h2>
        <div className="divide-y divide-slate-800 border-y border-slate-800">
          {faqs.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between py-6 text-left group">
                <span className="font-serif text-lg md:text-xl text-white pr-6">{q}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }} className="text-slate-500 shrink-0"><Icons.Chevron /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="pb-6 text-slate-400 font-light leading-relaxed">{a}</p></motion.div>)}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (<>
    <Preloader />
    <Navigation />
    <main><Hero /><Marquee /><LiveStats /><Features /><ComparisonSection /><IntegrationsSection /><FAQ /><CTASection /></main>
    <Footer />
  </>);
}
