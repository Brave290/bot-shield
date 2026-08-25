"use client";
import { useState, useEffect } from "react";
"use client";
import { motion } from "framer-motion";
import { Icons, MotionLink, Footer, PageHero, CTASection, CONTACTS } from "@/components/site";
import { Navigation } from "@/components/Navigation";

const tiers = [
  { name: "Hobby", price: "$0", tag: "Side projects", feats: ["1,000 requests / month", "Core behavioral detection", "Community support", "Full source access"] },
  { name: "Pro", price: "$29", tag: "Real products", feats: ["100,000 requests / month", "Adaptive AI scoring", "Live analytics dashboard", "Priority email support", "99.9% uptime SLA"], hot: true },
  { name: "Enterprise", price: "Custom", tag: "Platforms", feats: ["Unlimited requests", "Dedicated infrastructure", "On-premise deployment", "24/7 support with SLA"] },
];

const compare = [
  ["Monthly requests", "1K", "100K", "Unlimited"],
  ["Behavioral scoring", "Core", "Adaptive AI", "Custom models"],
  ["Analytics retention", "7 days", "90 days", "Unlimited"],
  ["Support", "Community", "Priority email", "24/7 + Slack"],
  ["Uptime SLA", "—", "99.9%", "99.99%"],
  ["On-premise", "—", "—", "Included"],
];

export default function PricingPage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHero eyebrow="Pricing" title="Pay for protection," italic="not promises." subtitle="Three plans, no hidden meters, no surprise overages. Upgrade or downgrade whenever your traffic changes its mind." />
        <div className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-3 gap-6">
          {tiers.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`relative p-8 rounded-2xl border ${t.hot ? "border-blue-500 bg-blue-600/5" : "border-slate-800 bg-slate-950"}`}>
              {t.hot && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium">Most popular</span>}
              <h3 className="font-serif text-2xl font-semibold text-white">{t.name}</h3>
              <p className="text-sm text-slate-500 font-light mt-1">{t.tag}</p>
              <div className="mt-6 mb-8"><span className="font-serif text-5xl font-bold text-white">{prices[t.name]?.price ?? t.price}</span>{t.price !== "Custom" && <span className="text-slate-500 text-sm"> /mo</span>}</div>
              <ul className="space-y-3.5 mb-10">
                {t.feats.map((f) => (<li key={f} className="flex items-start gap-3 text-sm text-slate-300 font-light"><span className="mt-0.5 text-blue-400"><Icons.Check /></span>{f}</li>))}
              </ul>
              <MotionLink href="/dashboard" whileHover={{ scale: 1.02 }} className={`block text-center py-3.5 rounded-xl font-medium ${t.hot ? "bg-blue-600 hover:bg-blue-500 text-white" : "border border-slate-700 hover:border-slate-500 text-white"}`}>Choose {t.name}</MotionLink>
            </motion.div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-28">
          <h2 className="font-serif text-3xl font-bold text-white mb-8 text-center">Compare <span className="italic text-blue-400">everything.</span></h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-900/60 text-left">
                  <th className="p-5 text-slate-400 font-medium">Capability</th>
                  <th className="p-5 text-white font-medium">Hobby</th>
                  <th className="p-5 text-blue-400 font-medium">Pro</th>
                  <th className="p-5 text-white font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {compare.map((row) => (
                  <tr key={row[0]} className="bg-slate-950">
                    {row.map((cell, ci) => (<td key={ci} className={`p-5 font-light ${ci === 0 ? "text-slate-300" : "text-slate-400"}`}>{cell}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
