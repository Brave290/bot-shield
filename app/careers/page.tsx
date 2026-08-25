"use client";
"use client";
import { motion } from "framer-motion";
import { Icons, Navigation, Footer, PageHero } from "@/components/site";

const roles = [
  { title: "Senior Backend Engineer", type: "Remote · Full-time", body: "Own the scoring pipeline and verification endpoints. You think in latencies, indexes, and failure modes." },
  { title: "Security Researcher", type: "Remote · Part-time", body: "Break what we built. Study emerging bot tooling and turn your findings into new detection signals." },
  { title: "Developer Advocate", type: "Remote · Full-time", body: "Write the docs you wish existed. Talk to developers, collect their pain, and ship the fixes." },
];

export default function CareersPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHero eyebrow="Careers" title="Do the best work" italic="of your life." subtitle="Small team, high trust, zero meetings that could have been a pull request. We hire people who ship and who care." />
        <div className="max-w-4xl mx-auto px-6 pb-28 space-y-6">
          {roles.map((r, i) => (
            <motion.div key={r.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="p-8 rounded-2xl border border-slate-800 bg-slate-950 hover:border-blue-500/40 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                  <h2 className="font-serif text-2xl font-semibold text-white mb-2">{r.title}</h2>
                  <p className="text-xs text-blue-400 mb-4">{r.type}</p>
                  <p className="text-slate-400 font-light leading-relaxed">{r.body}</p>
                </div>
                <a href="mailto:info.bravehx@gmail.com?subject=Application" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shrink-0">
                  Apply <Icons.ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
          <p className="text-center text-slate-500 font-light text-sm pt-6">No matching role? Convince us we need you: <a className="text-blue-400 hover:text-blue-300" href="mailto:info.bravehx@gmail.com">info.bravehx@gmail.com</a></p>
        </div>
      </main>
      <Footer />
    </>
  );
}
