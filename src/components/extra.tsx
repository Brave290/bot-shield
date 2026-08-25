"use client";
import { motion } from "framer-motion";
import { Icons } from "@/components/site";

const rows = [
  ["User experience", "Invisible, zero friction", "Puzzles, checkboxes, frustration"],
  ["Setup time", "One script tag, 30 seconds", "SDKs, keys, styling, callbacks"],
  ["Accessibility", "Nothing to solve, WCAG safe", "Breaks screen readers and keyboards"],
  ["Privacy", "No cookies, hashed IPs", "Trackers and fingerprinting"],
  ["Bot resistance", "Behavioral physics, hard to fake", "Farms solve CAPTCHAs for cents"],
  ["Page speed impact", "Under 5KB", "Hundreds of KB of external JS"],
];

export function ComparisonSection() {
  return (
    <section className="py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.3em] uppercase text-blue-400 mb-4">The honest comparison</p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white">Why teams <span className="italic text-blue-400">switch.</span></h2>
        </div>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-800 overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-900/60 text-sm">
            <div className="p-5 text-slate-500 font-light hidden sm:block">Criterion</div>
            <div className="p-5 text-blue-400 font-medium col-span-1">BotShield</div>
            <div className="p-5 text-slate-400 font-medium col-span-2 sm:col-span-1">Traditional CAPTCHA</div>
          </div>
          {rows.map(([c, us, them], i) => (
            <motion.div key={c} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className={`grid grid-cols-1 sm:grid-cols-3 text-sm border-t border-slate-800 ${i % 2 ? "bg-slate-950" : "bg-slate-900/20"}`}>
              <div className="p-5 text-slate-500 font-light hidden sm:block">{c}</div>
              <div className="p-5 text-slate-200 font-light flex items-start gap-2 sm:col-span-1"><span className="text-emerald-400 mt-0.5"><Icons.Check /></span>{us}</div>
              <div className="p-5 text-slate-500 font-light flex items-start gap-2 sm:col-span-1"><span className="text-red-400/70 mt-0.5"><Icons.X className="w-4 h-4" /></span>{them}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const stacks = ["Next.js", "React", "Vue", "Svelte", "Angular", "Plain HTML", "WordPress", "Shopify", "Laravel", "Rails", "Django", "Go"];

export function IntegrationsSection() {
  return (
    <section className="py-28 bg-slate-900/20 border-y border-slate-800/60">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-blue-400 mb-4">Works everywhere</p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-14">Plays nice with <span className="italic text-blue-400">your stack.</span></h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stacks.map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} whileHover={{ y: -6, scale: 1.05 }} className="p-5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 font-medium text-sm hover:border-blue-500/40 transition-colors">
              {s}
            </motion.div>
          ))}
        </div>
        <p className="mt-10 text-slate-500 font-light text-sm">If it renders HTML, BotShield protects it. No SDK required, ever.</p>
      </div>
    </section>
  );
}
