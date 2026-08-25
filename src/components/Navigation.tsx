"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icons, CONTACTS, MotionLink } from "@/components/site";

function Hamburger({ open }: { open: boolean }) {
  return (
    <div className="relative w-8 h-6 flex flex-col justify-between">
      <span className={`block h-[2px] bg-current rounded-full transition-all duration-500 ${open ? "rotate-45 translate-y-[11px] w-full" : "w-full"}`} />
      <span className={`block h-[2px] bg-current rounded-full transition-all duration-300 self-end ${open ? "opacity-0" : "w-2/3"}`} />
      <span className={`block h-[2px] bg-current rounded-full transition-all duration-500 ${open ? "-rotate-45 -translate-y-[11px] w-full" : "w-1/2"}`} />
    </div>
  );
}

export function Navigation({ menu }: { menu?: { label: string; href: string }[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored) setTheme(stored);
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) setTheme("light");
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const links = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Documentation", href: "/docs" },
    { label: "API", href: "/api-reference" },
    { label: "Company", href: "/about" },
  ];

  return (<>
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
          {/* Search - now visible on mobile */}
          <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Toggle search" className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
            <Icons.Search />
          </button>
          {/* Theme toggle */}
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme" className="flex w-10 h-10 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
            {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
          </button>
          <MotionLink href="/dashboard" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            Get Started<Icons.ArrowRight className="w-4 h-4" />
          </MotionLink>
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-white">
            <Hamburger open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Premium Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-start justify-center pt-32 px-6" onClick={() => setSearchOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500"><Icons.Search className="w-6 h-6" /></span>
                <input autoFocus type="search" placeholder="Search documentation, guides, endpoints..." className="w-full bg-slate-900 border-2 border-blue-500/50 rounded-2xl pl-16 pr-6 py-6 text-lg text-white placeholder-slate-500 focus:outline-none" />
                <button onClick={() => setSearchOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 font-medium">ESC</button>
              </div>
              <div className="mt-6 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                <p className="text-sm text-slate-500 mb-4">Quick links</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition-colors group">
                      <Icons.ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      <span className="text-sm text-slate-300 group-hover:text-white">{l.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>

    <AnimatePresence>
      {menuOpen && (
        <motion.div initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }} exit={{ clipPath: "inset(0 0 100% 0)" }} transition={{ duration: 0.6 }} className="fixed inset-0 z-[70] bg-slate-950 lg:hidden overflow-y-auto">
          <div className="px-6 pt-28 pb-16">
            <nav className="space-y-2">
              {(menu || links).map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
                  <Link href={l.href} onClick={() => setMenuOpen(false)} className="group flex items-center justify-between py-4 border-b border-slate-800/60">
                    <span className="font-serif text-4xl text-white group-hover:italic group-hover:text-blue-400 transition-colors">{l.label}</span>
                    <Icons.ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-blue-400 transition-all" />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-10 space-y-4">
              {/* Mobile theme toggle */}
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-slate-800 text-white">
                {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
              </button>
              <MotionLink href="/dashboard" className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 text-white font-medium">Get Started<Icons.ArrowRight className="w-4 h-4" /></MotionLink>
              <div className="flex items-center justify-center gap-5 pt-4">
                {CONTACTS.map((c) => (<a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer" aria-label={c.name} className="text-slate-500 hover:text-white transition-colors"><c.Icon /></a>))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>);
}
