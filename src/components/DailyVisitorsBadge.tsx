"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DailyVisitorsBadge() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const track = async () => {
      try {
        const res = await fetch("/api/track-visitor", { method: "POST" });
        const data = await res.json();
        if (typeof data.total === "number") setTotal(data.total);
      } catch { /* silent */ }
    };
    track();
  }, []);

  if (total === null) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800">
        <div className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />
        <div className="w-16 h-4 bg-slate-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
      <span className="text-xs font-medium text-slate-400">
        <span className="text-white font-bold">{total.toLocaleString()}</span> {total === 1 ? "person has" : "people have"} entered this site
      </span>
    </motion.div>
  );
}
