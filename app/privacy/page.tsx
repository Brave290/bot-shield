"use client";
import { Navigation } from "@/components/Navigation";
import { Footer, PageHero } from "@/components/site";
const S = ({ t, b }: { t: string; b: string }) => (<section className="mb-8"><h2 className="font-serif text-2xl font-semibold text-white mb-3">{t}</h2><p className="text-slate-400 font-light leading-relaxed">{b}</p></section>);
export default function Privacy() {
  return (<>
    <Navigation />
    <main><PageHero eyebrow="Legal" title="Privacy," italic="respected." subtitle="What we collect, what we refuse to collect, and why. Last updated August 2026." />
      <div className="max-w-3xl mx-auto px-6 pb-28">
        <S t="1. What we collect" b="Account email, project settings, and hashed visitor identifiers (SHA-256). Contact messages and job applications you voluntarily send us. That is the whole list." />
        <S t="2. What we never collect" b="Raw IP addresses of your end users, keystroke content, form contents, or anything typed into protected pages. The widget measures rhythm, not data." />
        <S t="3. Hashing & storage" b="Visitor IPs are hashed at the API layer before storage. A hash cannot be reversed to an IP without brute force, and we salt per deployment." />
        <S t="4. Cookies" b="The detection widget sets no tracking cookies. This site stores only a theme preference and session storage for analytics." />
        <S t="5. Retention" b="Verification logs are retained per your plan (7 to 90 days) then deleted. Contact messages and applications are kept until you ask us to remove them." />
        <S t="6. Subprocessors" b="We rely on Supabase (database & auth), Vercel (hosting & edge), and Resend (transactional email), each with their own compliant processing agreements." />
        <S t="7. Your rights" b="Email info.bravehx@gmail.com to access, correct, or erase personal data. We respond within 30 days, usually much faster." />
        <S t="8. Children" b="The service is not directed to children under 13 and we do not knowingly collect their data." />
        <S t="9. Changes" b="When we change this policy we update the date above and, for material changes, notify account owners by email." />
        <S t="10. Contact" b="Privacy questions: info.bravehx@gmail.com · BraveHX Studio, a subsidiary of Brave HX Technology." />
      </div>
    </main>
    <Footer />
  </>);
}
