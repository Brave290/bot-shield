"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { Icons, Navigation, Footer, PageHero } from "@/components/site";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const roles = ["Senior Backend Engineer", "Security Researcher", "Developer Advocate"];

const template = (role: string) =>
`Hello BraveHX team,

I am applying for the ${role} position.

Why me:
- 

Relevant work:
- 

I have attached my CV and I am ready to talk.

Thank you.`;

export default function Careers() {
  const [role, setRole] = useState(roles[0]);
  const [form, setForm] = useState({ name: "", email: "", portfolio: "", note: template(roles[0]) });
  const [cv, setCv] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickRole = (r: string) => { setRole(r); setForm({ ...form, note: template(r) }); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Your name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "A valid email is required.";
    if (!cv) errs.cv = "Please attach your CV (PDF or DOC, under 5MB).";
    else if (cv.size > 5 * 1024 * 1024) errs.cv = "CV must be under 5MB.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState("sending");
    try {
      const path = `${Date.now()}-${cv!.name.replace(/\s+/g, "-")}`;
      const up = await supabase.storage.from("careers").upload(path, cv!);
      if (up.error) throw up.error;
      const { data } = supabase.storage.from("careers").getPublicUrl(path);
      const ins = await supabase.from("job_applications").insert({ role, name: form.name, email: form.email, portfolio: form.portfolio, note: form.note, cv_url: data.publicUrl });
      if (ins.error) throw ins.error;
      setState("sent");
    } catch { setState("error"); }
  };

  return (<>
    <Navigation />
    <main>
      <PageHero eyebrow="Careers" title="Do the best work" italic="of your life." subtitle="Small team, high trust, zero meetings that could have been a pull request." />
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        {roles.map((r, i) => (
          <motion.div key={r} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="p-8 rounded-2xl border border-slate-800 bg-slate-950">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div><h2 className="font-serif text-2xl font-semibold text-white mb-2">{r}</h2><p className="text-xs text-blue-400">Remote · Full-time</p></div>
              <button onClick={() => { pickRole(r); document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" }); }} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">Apply<Icons.ArrowRight className="w-4 h-4" /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <div id="apply" className="max-w-3xl mx-auto px-6 pb-28">
        <form onSubmit={submit} className="p-8 rounded-2xl border border-slate-800 bg-slate-950 space-y-5">
          <h2 className="font-serif text-2xl font-bold text-white">Apply for <span className="italic text-blue-400">{role}</span></h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><label className="block text-sm text-slate-400 mb-2">Full name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" placeholder="Your name" />{errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}</div>
            <div><label className="block text-sm text-slate-400 mb-2">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" placeholder="you@email.com" />{errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}</div>
          </div>
          <div><label className="block text-sm text-slate-400 mb-2">Portfolio / GitHub (optional)</label><input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60" placeholder="https://github.com/you" /></div>
          <div><label className="block text-sm text-slate-400 mb-2">CV / Resume * (PDF or DOC, max 5MB)</label><input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCv(e.target.files?.[0] || null)} className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:text-sm file:font-medium" />{errors.cv && <p className="mt-1 text-xs text-red-400">{errors.cv}</p>}</div>
          <div><label className="block text-sm text-slate-400 mb-2">Cover note (pre-filled, edit it)</label><textarea rows={9} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/60 resize-y" /></div>
          {state === "error" && <p className="text-sm text-red-400">Upload failed. Please retry or email info.bravehx@gmail.com.</p>}
          {state === "sent" ? (
            <div className="text-center py-6"><p className="text-emerald-400 font-medium">Application received. We will be in touch.</p></div>
          ) : (
            <button type="submit" disabled={state === "sending"} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium">{state === "sending" ? "Submitting..." : "Submit application"}</button>
          )}
        </form>
      </div>
    </main>
    <Footer />
  </>);
}
