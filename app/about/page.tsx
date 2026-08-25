"use client";
"use client";
import { motion } from "framer-motion";
import { Icons, MotionLink, Footer, PageHero, CTASection, CONTACTS } from "@/components/site";
import { Navigation } from "@/components/Navigation";

const values = [
  { Icon: Icons.Eye, t: "User-centered", b: "Every decision starts with the person on the other side of the screen. If a feature annoys real users, it does not ship." },
  { Icon: Icons.Lock, t: "Honest by default", b: "Our public stats stream from the production database. The most-popular badge moves when users move. No painted numbers." },
  { Icon: Icons.Bolt, t: "Performance focused", b: "Security that slows your site down is a tax. We obsess over kilobytes and milliseconds so you never have to." },
  { Icon: Icons.Chip, t: "Future ready", b: "Modular scoring, open source core, and clean APIs. What you integrate today survives what we build tomorrow." },
];

const timeline = [
  ["2026 · Q1", "BotShield begins as a weekend experiment: can behavioral physics replace CAPTCHAs?"],
  ["2026 · Q2", "First public beta. The scoring engine ships rule-based, with a modular path to ML."],
  ["2026 · Q3", "Real-time telemetry goes public. This website starts displaying its own live numbers."],
  ["Today", "You, reading this page. The best part of the timeline so far."],
];

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHero eyebrow="About" title="Built by a developer who" italic="hates CAPTCHAs." subtitle="BotShield exists because 'select all images with traffic lights' is not a security strategy, it is a punishment. We build protection that respects people." />
        <div className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-6">
          {values.map((v, i) => (
            <motion.div key={v.t} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="p-8 rounded-2xl border border-slate-800 bg-slate-950">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6"><v.Icon /></div>
              <h3 className="font-serif text-xl font-semibold text-white mb-3">{v.t}</h3>
              <p className="text-slate-400 font-light leading-relaxed">{v.b}</p>
            </motion.div>
          ))}
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-28">
          <h2 className="font-serif text-3xl font-bold text-white mb-10 text-center">The story <span className="italic text-blue-400">so far.</span></h2>
          <div className="space-y-0 border-l border-slate-800 ml-3">
            {timeline.map(([date, text], i) => (
              <motion.div key={date} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative pl-10 pb-12">
                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
                <p className="text-xs tracking-[0.25em] uppercase text-blue-400 mb-2">{date}</p>
                <p className="text-slate-300 font-light leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 p-8 rounded-2xl border border-slate-800 bg-slate-950 text-center">
            <p className="text-slate-400 font-light mb-6">One person, one mission, every channel open. Say hello anytime.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {CONTACTS.map((c) => (
                <a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white text-sm transition-colors">
                  <c.Icon className="w-4 h-4" /> {c.handle}
                </a>
              ))}
            </div>
          </div>
        </div>
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
