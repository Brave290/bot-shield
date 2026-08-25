"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DailyVisitorsBadge() {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/track-visitor", { method: "POST" }).then((r) => r.json()).then((d) => { if (typeof d.total === "number") setTotal(d.total); }).catch(() => {});
  }, []);
  if (total === null) return <div className="h-4 w-40 bg-slate-900 rounded animate-pulse" />;
  return (
    <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-light tracking-wide text-slate-500">
        <span className="text-slate-300 font-medium">{total.toLocaleString()}</span> {total === 1 ? "person has" : "people have"} entered this site
      </span>
    </motion.div>
  );
}
