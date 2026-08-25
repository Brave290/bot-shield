"use client";
"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Icons, MotionLink } from "@/components/site";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {}, []);
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-slate-950 to-slate-950" />
      <div className="relative max-w-2xl text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mb-10"><Icons.Shield className="w-9 h-9" /></motion.div>
        <p className="text-xs tracking-[0.35em] uppercase text-red-400 mb-6">Error 500 — internal fault</p>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight">The shield <span className="italic text-red-400">slipped.</span></h1>
        <p className="mt-6 text-lg text-slate-400 font-light">Something failed on our side. Engineers are paged and investigating right now.</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button onClick={reset} whileHover={{ scale: 1.04 }} className="px-8 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium">Try again</motion.button>
          <MotionLink href="/" whileHover={{ scale: 1.04 }} className="px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-white font-medium">Back to safety</MotionLink>
        </div>
      </div>
    </div>
  );
}
