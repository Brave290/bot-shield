"use client";
import { Icons, MotionLink, Footer, PageHero, CTASection, CONTACTS } from "@/components/site";
import { Navigation } from "@/components/Navigation";
const S = ({ t, b }: { t: string; b: string }) => (<section className="mb-10"><h2 className="font-serif text-2xl font-semibold text-white mb-3">{t}</h2><p className="text-slate-400 font-light leading-relaxed">{b}</p></section>);
export default function Terms() {
  return (<>
    <Navigation />
    <main><PageHero eyebrow="Legal" title="Terms of" italic="service." subtitle="The plain-language agreement between you and BotShield. Last updated August 2026." />
      <div className="max-w-3xl mx-auto px-6 pb-28">
        <S t="1. Acceptance" b="By creating an account or calling the API you agree to these terms. If you disagree, do not use the service. Simple as that." />
        <S t="2. Fair use" b="Free tiers are for genuine projects. Abuse, credential stuffing, or reselling capacity without a license gets your key revoked." />
        <S t="3. Your responsibilities" b="You own your traffic. BotShield provides detection signals; final decisions on requests remain yours to make on your infrastructure." />
        <S t="4. Availability" b="We target 99.9% uptime on paid plans. The service is provided as-is during the public beta, and we communicate incidents openly." />
        <S t="5. Liability" b="To the maximum extent permitted by law, our liability is limited to the amount you paid us in the last twelve months." />
        <S t="6. Changes" b="We may update these terms. Material changes are announced at least 14 days in advance on this page and by email." />
      </div>
    </main>
    <Footer />
  </>);
}
