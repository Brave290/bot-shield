"use client";
import { motion } from "framer-motion";
import { Icons } from "@/components/site";
export function BrandLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-blue-500/20" />
        <motion.div className="absolute inset-0 rounded-full border-t-2 border-blue-500" animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-blue-400"><Icons.Shield className="w-8 h-8" /></motion.div>
      </div>
    </div>
  );
}
