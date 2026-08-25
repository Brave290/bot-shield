"use client";
import { Navigation, Footer, PageHero, Icons } from "@/components/site";
const items = [
  ["Hashed identifiers", "Visitor IPs are SHA-256 hashed in transit at the API layer. Raw addresses never touch a disk."],
  ["Row-Level Security", "Every Postgres table ships with RLS policies. Projects are invisible across accounts by database law, not app hope."],
  ["Short-lived tokens", "Verification JWTs expire in 5 minutes and are signed per-project. Replay windows are tiny by design."],
  ["Origin pinning", "Public keys can be locked to your domains, so a leaked key dies outside your origin."],
  ["Responsible disclosure", "Found a hole? Email info.bravehx@gmail.com with subject SECURITY. We acknowledge within 48 hours and credit reporters."],
];
export default function Security() {
  return (<>
    <Navigation />
    <main><PageHero eyebrow="Trust" title="Security," italic="documented." subtitle="The controls we run, in writing, so you can verify instead of trust." />
      <div className="max-w-3xl mx-auto px-6 pb-28 space-y-6">
        {items.map(([t, b]) => (
          <div key={t} className="flex gap-4 p-6 rounded-2xl border border-slate-800 bg-slate-950">
            <span className="mt-1 shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><Icons.Lock className="w-4 h-4" /></span>
            <div><h2 className="text-white font-medium mb-1">{t}</h2><p className="text-slate-400 font-light text-sm leading-relaxed">{b}</p></div>
          </div>
        ))}
      </div>
    </main>
    <Footer />
  </>);
}
