"use client";
import { Navigation } from "@/components/Navigation";
import { Footer, PageHero, Icons } from "@/components/site";
const items = [
  ["Hashed identifiers", "Visitor IPs are SHA-256 hashed in transit at the API layer. Raw addresses never touch a disk."],
  ["Row-Level Security", "Every Postgres table ships with RLS policies. Projects and plans are invisible across accounts by database law, not app hope."],
  ["Short-lived tokens", "Verification JWTs expire in 5 minutes and are signed per-project. Replay windows are tiny by design."],
  ["Origin pinning", "Public keys can be locked to your domains, so a leaked key dies outside your origin."],
  ["Live rate limiting", "Signups, logins, resets, and API calls are throttled per IP, email, and key. Thresholds are admin-editable in real time."],
  ["Gated admin console", "Admin endpoints verify your session server-side against an admins table. The service-role key never leaves the server."],
  ["Fail-open design", "If detection is unreachable, real users are never locked out. We would rather miss a bot than lose a customer."],
];
export default function Security() {
  return (<>
    <Navigation />
    <main><PageHero eyebrow="Trust" title="Security," italic="documented." subtitle="The controls we run, in writing, so you can verify instead of trust." />
      <div className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        {items.map(([t, b]) => (
          <div key={t} className="flex gap-4 p-6 rounded-2xl border border-slate-800 bg-slate-950">
            <span className="mt-1 shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><Icons.Lock className="w-4 h-4" /></span>
            <div><h2 className="text-white font-medium mb-1">{t}</h2><p className="text-slate-400 font-light text-sm leading-relaxed">{b}</p></div>
          </div>
        ))}
      </div>
      <div className="max-w-3xl mx-auto px-6 pb-28">
        <div className="p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <h2 className="font-serif text-2xl font-semibold text-white mb-3">Responsible disclosure</h2>
          <p className="text-slate-400 font-light leading-relaxed mb-4">Found a hole? Email <a className="text-emerald-400" href="mailto:info.bravehx@gmail.com?subject=SECURITY">info.bravehx@gmail.com</a> with subject SECURITY. We acknowledge within 48 hours, coordinate a fix window, and credit verified reporters on this page.</p>
          <p className="text-slate-500 text-sm font-light">Out of scope: social engineering, physical attacks, and issues in third-party services we do not control.</p>
        </div>
      </div>
    </main>
    <Footer />
  </>);
}
