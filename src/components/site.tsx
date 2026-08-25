"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export const MotionLink = motion(Link);

export const Icons = {
  Shield: ({ className = "w-6 h-6" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>),
  Search: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  ArrowRight: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>),
  Check: ({ className = "w-4 h-4" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>),
  Bolt: ({ className = "w-6 h-6" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M13 2 3 14h8l-1 8 11-13h-9l1-7z"/></svg>),
  Lock: ({ className = "w-6 h-6" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.5"/></svg>),
  Chart: ({ className = "w-6 h-6" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M7 15v3M11 11v7M15 7v11M19 4v14"/></svg>),
  Globe: ({ className = "w-6 h-6" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>),
  Chip: ({ className = "w-6 h-6" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>),
  Terminal: ({ className = "w-6 h-6" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m7 9 3 3-3 3"/><path d="M13 15h4"/></svg>),
  Eye: ({ className = "w-6 h-6" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>),
  Github: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.05.78 2.13v3.16c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>),
  X: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>),
  Linkedin: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>),
  Telegram: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>),
  Mail: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>),
  Sun: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>),
  Moon: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  Chevron: ({ className = "w-5 h-5" }: { className?: string }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>),
};

export const CONTACTS = [
  { name: "GitHub", handle: "@brave290", href: "https://github.com/brave290", Icon: Icons.Github },
  { name: "X", handle: "@bravehx", href: "https://x.com/bravehx", Icon: Icons.X },
  { name: "LinkedIn", handle: "@bravehx", href: "https://linkedin.com/in/bravehx", Icon: Icons.Linkedin },
  { name: "Telegram", handle: "@bravehx", href: "https://t.me/bravehx", Icon: Icons.Telegram },
  { name: "Email", handle: "info.bravehx@gmail.com", href: "mailto:info.bravehx@gmail.com", Icon: Icons.Mail },
];

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / 1800) * 100));
      setProgress(p);
      if (p >= 100) { clearInterval(t); setTimeout(() => setDone(true), 300); }
    }, 30);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center" exit={{ opacity: 0, transition: { duration: 0.5 } }}>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-blue-500/20" />
            <motion.div className="absolute inset-0 rounded-full border-t-2 border-blue-500" animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-blue-400"><Icons.Shield className="w-10 h-10" /></motion.div>
          </div>
          <div className="mt-8 font-serif text-2xl text-white tracking-[0.3em] uppercase">BotShield</div>
          <div className="mt-4 w-56 h-px bg-slate-800 overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="mt-3 text-xs text-slate-500 tabular-nums tracking-widest">{progress}%</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Hamburger({ open }: { open: boolean }) {
  return (
    <div className="relative w-8 h-6 flex flex-col justify-between">
      <span className={`block h-[2px] bg-white rounded-full transition-all duration-500 ${open ? "rotate-45 translate-y-[11px] w-full" : "w-full"}`} />
      <span className={`block h-[2px] bg-white rounded-full transition-all duration-300 self-end ${open ? "opacity-0" : "w-2/3"}`} />
      <span className={`block h-[2px] bg-white rounded-full transition-all duration-500 ${open ? "-rotate-45 -translate-y-[11px] w-full" : "w-1/2"}`} />
    </div>
  );
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Documentation", href: "/docs" },
    { label: "API", href: "/api-reference" },
    { label: "Company", href: "/about" },
  ];
  return (
    <>
      <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }} className={`fixed top-0 inset-x-0 z-[80] transition-colors duration-500 ${scrolled ? "bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/60" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30"><Icons.Shield className="w-5 h-5" /></span>
            <span className="font-serif text-2xl font-bold text-white">BotShield</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (<Link key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Toggle search" className="hidden sm:flex w-10 h-10 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"><Icons.Search /></button>
            <MotionLink href="/dashboard" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">Get Started<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60"><Hamburger open={menuOpen} /></button>
          </div>
        </div>
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-800/60 bg-slate-950/95 backdrop-blur-xl overflow-hidden">
              <div className="max-w-7xl mx-auto px-6 py-4 relative">
                <span className="absolute left-10 top-1/2 translate-y-1 text-slate-500"><Icons.Search /></span>
                <input autoFocus type="search" placeholder="Search documentation, guides, endpoints..." className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }} exit={{ clipPath: "inset(0 0 100% 0)" }} transition={{ duration: 0.6 }} className="fixed inset-0 z-[70] bg-slate-950 lg:hidden overflow-y-auto">
            <div className="px-6 pt-28 pb-16">
              <nav className="space-y-2">
                {links.map((l, i) => (
                  <motion.div key={l.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
                    <Link href={l.href} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between py-4 border-b border-slate-800/60">
                      <span className="font-serif text-4xl text-white group-hover:italic group-hover:text-blue-400 transition-colors">{l.label}</span>
                      <Icons.ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-blue-400 transition-all" />
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-10 space-y-4">
                <MotionLink href="/dashboard" className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 text-white font-medium">Get Started<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
                <div className="flex items-center justify-center gap-5 pt-4">
                  {CONTACTS.map((c) => (<a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer" aria-label={c.name} className="text-slate-500 hover:text-white transition-colors"><c.Icon /></a>))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function PageHero({ eyebrow, title, italic, subtitle }: { eyebrow: string; title: string; italic: string; subtitle: string }) {
  return (
    <section className="relative pt-40 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-slate-950 to-slate-950" />
      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium tracking-[0.35em] uppercase text-blue-400 mb-6">{eyebrow}</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-serif text-5xl md:text-7xl font-bold text-white leading-[1.05]">{title} <span className="italic font-medium text-blue-400">{italic}</span></motion.h1>
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 text-lg text-slate-400 font-light leading-relaxed max-w-2xl mx-auto">{subtitle}</motion.p>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 to-slate-950" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-4xl md:text-6xl font-bold text-white leading-tight">Ready to build <span className="italic text-blue-400">without fear?</span></motion.h2>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <MotionLink href="/dashboard" whileHover={{ scale: 1.04 }} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Get Started Free<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
          <MotionLink href="/contact" whileHover={{ scale: 1.04 }} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-white font-medium">Talk to us</MotionLink>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  const cols = [
    { title: "Product", links: [["Features", "/features"], ["Pricing", "/pricing"], ["Documentation", "/docs"], ["API Reference", "/api-reference"]] },
    { title: "Company", links: [["About", "/about"], ["Blog", "/blog"], ["Careers", "/careers"], ["Contact", "/contact"]] },
    { title: "Legal", links: [["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"], ["Security", "/security"]] },
  ];
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2 md:col-span-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Icons.Shield className="w-5 h-5" /></span>
              <span className="font-serif text-2xl font-bold text-white">BotShield</span>
            </Link>
            <p className="mt-5 text-sm text-slate-400 font-light leading-relaxed max-w-sm">Enterprise-grade bot detection for the modern web. Behavioral analysis, cryptographic tokens, real-time analytics, zero CAPTCHA nonsense.</p>
            <p className="mt-4 text-xs text-slate-500 font-light">A product of <a href="https://bravehx.online" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">BraveHX Studio</a>, a subsidiary of Brave HX Technology.</p>
            <div className="mt-6 flex items-center gap-4">
              {CONTACTS.map((c) => (<a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer" aria-label={c.name} className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-colors"><c.Icon /></a>))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(([label, href]) => (<li key={label}><Link href={href} className="text-sm text-slate-400 hover:text-white font-light transition-colors">{label}</Link></li>))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-8 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-light">© 2026 BotShield · BraveHX Studio · Brave HX Technology. MIT License.</p>
          <div className="flex items-center gap-2 text-xs text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />All systems operational</div>
        </div>
      </div>
    </footer>
  );
}
