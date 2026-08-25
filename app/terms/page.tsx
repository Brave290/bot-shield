"use client";
import { Navigation } from "@/components/Navigation";
import { Footer, PageHero } from "@/components/site";
const S = ({ t, b }: { t: string; b: string }) => (<section className="mb-8"><h2 className="font-serif text-2xl font-semibold text-white mb-3">{t}</h2><p className="text-slate-400 font-light leading-relaxed">{b}</p></section>);
export default function Terms() {
  return (<>
    <Navigation />
    <main><PageHero eyebrow="Legal" title="Terms of" italic="service." subtitle="The plain-language agreement between you and BotShield. Last updated August 2026." />
      <div className="max-w-3xl mx-auto px-6 pb-28">
        <S t="1. Acceptance" b="By creating an account, calling the API, or adding the widget to a site, you agree to these terms. If you disagree, do not use the service." />
        <S t="2. The service" b="BotShield provides bot-detection signals, signed verification tokens, and analytics dashboards. Final decisions on requests remain yours, made on your infrastructure." />
        <S t="3. Accounts & keys" b="You are responsible for safeguarding secret keys. Rotate them from the dashboard any time. Activity performed with your keys is your activity." />
        <S t="4. Fair use" b="Free tiers are for genuine projects. Abuse, credential stuffing, spam, or reselling capacity without a license gets keys revoked and accounts suspended." />
        <S t="5. Billing & plans" b="Paid plans activate on a grace basis until Stripe checkout launches. When billing goes live, plans renew monthly and you can downgrade at any time." />
        <S t="6. Availability" b="We target 99.9% uptime on paid plans and communicate incidents openly. The service is provided as-is during the public beta." />
        <S t="7. Intellectual property" b="The core engine is open source under MIT. The hosted service, brand, and dashboards remain property of Brave HX Technology." />
        <S t="8. Liability" b="To the maximum extent permitted by law, our liability is limited to the amount you paid us in the last twelve months." />
        <S t="9. Changes" b="We may update these terms. Material changes are announced at least 14 days in advance on this page and by email where we have one." />
        <S t="10. Contact" b="Questions: info.bravehx@gmail.com · Telegram @bravehx · BraveHX Studio, a subsidiary of Brave HX Technology." />
      </div>
    </main>
    <Footer />
  </>);
}
