"use client";
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Icons, Navigation, Footer, PageHero, CONTACTS } from "@/components/site";

export default function Contact() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) throw new Error();
      setState("sent");
    } catch { setState("error"); }
  };

  return (<>
    <Navigation />
    <main>
      <PageHero eyebrow="Contact" title="Talk to a human," italic="quickly." subtitle="Questions, partnerships, or a bug that slipped past us. Every message lands with a person." />
      <div className="max-w-6xl mx-auto px-6 pb-28 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {CONTACTS.map((c, i) => (
            <motion.a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="flex items-center gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-950 hover:border-blue-500/40 transition-colors">
              <span className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><c.Icon /></span>
              <span><span className="block text-white font-medium">{c.name}</span><span className="block text-sm text-slate-500 font-light">{c.handle}</span></span>
            </motion.a>
          ))}
        </div>
        <form onSubmit={submit} className="lg:col-span-3 p-8 rounded-2xl border border-slate-800 bg-slate-950 space-y-5">
          {state === "sent" ? (
            <div className="text-center py-16 space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Icons.Check className="w-7 h-7" /></div>
              <h2 className="font-serif text-3xl font-bold text-white">Message received.</h2>
              <p className="text-slate-400 font-light">We reply within one business day, usually faster.</p>
              <button type="button" onClick={() => { setState("idle"); setForm({ name: "", email: "", message: "" }); }} className="px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-white text-sm font-medium">Send another message</button>
            </div>
          ) : (<>
            <div className="grid sm:grid-cols-2 gap-5">
              <div><label className="block text-sm text-slate-400 mb-2" htmlFor="n">Your name</label><input id="n" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" placeholder="Ada Lovelace" /></div>
              <div><label className="block text-sm text-slate-400 mb-2" htmlFor="e">Email</label><input id="e" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" placeholder="you@company.com" /></div>
            </div>
            <div><label className="block text-sm text-slate-400 mb-2" htmlFor="m">Message</label><textarea id="m" required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 resize-none" placeholder="Tell us what you are building, or what broke." /></div>
            {state === "error" && <p className="text-sm text-red-400">Something went wrong. You can retry, or email info.bravehx@gmail.com directly.</p>}
            <button type="submit" disabled={state === "sending"} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium">
              {state === "sending" ? "Sending..." : "Send message"}<Icons.ArrowRight className="w-4 h-4" />
            </button>
          </>)}
        </form>
      </div>
    </main>
    <Footer />
  </>);
}
