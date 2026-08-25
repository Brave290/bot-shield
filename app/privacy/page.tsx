"use client";
import { Navigation, Footer, PageHero } from "@/components/site";
const S = ({ t, b }: { t: string; b: string }) => (<section className="mb-10"><h2 className="font-serif text-2xl font-semibold text-white mb-3">{t}</h2><p className="text-slate-400 font-light leading-relaxed">{b}</p></section>);
export default function Privacy() {
  return (<>
    <Navigation />
    <main><PageHero eyebrow="Legal" title="Privacy," italic="respected." subtitle="What we collect, what we refuse to collect, and why. Last updated August 2026." />
      <div className="max-w-3xl mx-auto px-6 pb-28">
        <S t="1. What we collect" b="Account email, project settings, and hashed visitor identifiers (SHA-256). That is the whole list for the core product." />
        <S t="2. What we never collect" b="Raw IP addresses of your end users, keystroke content, form contents, or anything typed into protected pages. The widget measures rhythm, not data." />
        <S t="3. Cookies" b="The detection widget sets no tracking cookies. This site uses one localStorage flag for cookie consent and session storage for analytics." />
        <S t="4. Retention" b="Verification logs are retained per your plan (7 to 90 days) then deleted. Contact messages are kept until you ask us to remove them." />
        <S t="5. Your rights" b="Email info.bravehx@gmail.com to access, correct, or erase personal data. We respond within 30 days, usually much faster." />
      </div>
    </main>
    <Footer />
  </>);
}
