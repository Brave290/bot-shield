"use client";
"use client";
import { motion } from "framer-motion";
import { Icons, Navigation, Footer, PageHero, CTASection } from "@/components/site";

const blocks = [
  { Icon: Icons.Eye, title: "Behavioral biometrics", body: "Every human moves differently. Pointer curvature, hesitation, acceleration, keystroke rhythm. BotShield builds a live behavioral profile in the first seconds of a session and scores it against known bot signatures.", points: ["Pointer entropy and curve analysis", "Keystroke cadence profiling", "Session timing heuristics"] },
  { Icon: Icons.Lock, title: "Token-based verification", body: "Passing users receive a signed JWT with a five-minute lifespan. Your backend verifies it against your secret key. The browser never sees anything sensitive, and replayed tokens die quickly.", points: ["HS256 signed, short expiry", "One-call backend verification", "Per-project secret keys"] },
  { Icon: Icons.Chart, title: "Transparent analytics", body: "A live dashboard fed directly by your production database. Requests, blocks, score distributions, and origins, updated in real time with no sampling and no rounding tricks.", points: ["Real-time streaming updates", "Per-project breakdowns", "Exportable event logs"] },
  { Icon: Icons.Globe, title: "Origin pinning and abuse control", body: "Bind your API key to your domains. If someone lifts your key and drops it on another site, requests simply fail. Rate limits and reputation tracking handle the rest.", points: ["Domain allow-lists", "IP reputation memory", "Sensitivity presets per project"] },
];

export default function FeaturesPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHero eyebrow="Features" title="Depth, not" italic="checklists." subtitle="Four pillars carry the entire platform. Each one is built to be boring, reliable, and fast, the way security should be." />
        <div className="max-w-6xl mx-auto px-6 pb-28 space-y-8">
          {blocks.map((b, i) => (
            <motion.section key={b.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: i * 0.05 }} className={`grid md:grid-cols-5 gap-10 p-10 rounded-2xl border border-slate-800 bg-slate-950 ${i % 2 ? "md:[direction:rtl]" : ""}`}>
              <div className="md:col-span-3 [direction:ltr]">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6"><b.Icon /></div>
                <h2 className="font-serif text-3xl font-semibold text-white mb-4">{b.title}</h2>
                <p className="text-slate-400 font-light leading-relaxed">{b.body}</p>
              </div>
              <ul className="md:col-span-2 [direction:ltr] space-y-4 self-center">
                {b.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-slate-300 font-light"><span className="mt-0.5 text-blue-400"><Icons.Check /></span>{p}</li>
                ))}
              </ul>
            </motion.section>
          ))}
        </div>
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
