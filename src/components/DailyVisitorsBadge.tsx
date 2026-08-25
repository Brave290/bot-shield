"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DailyVisitorsBadge() {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasTracked = sessionStorage.getItem('visitorTracked');
    const trackVisitor = async () => {
      try {
        const res = await fetch('/api/track-visitor', { method: 'POST' });
        const data = await res.json();
        if (data.count !== undefined) setCount(data.count);
      } catch (error) { console.error('Failed to track visitor:', error); } 
      finally {
        setIsLoading(false);
        sessionStorage.setItem('visitorTracked', 'true');
      }
    };
    if (!hasTracked) { trackVisitor(); } 
    else {
      fetch('/api/track-visitor', { method: 'POST' }).then(res => res.json()).then(data => {
        if (data.count !== undefined) setCount(data.count);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, []);

  if (isLoading) return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800">
      <div className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />
      <div className="w-12 h-4 bg-slate-800 rounded animate-pulse" />
    </div>
  );

  return (
    <motion.div 
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 backdrop-blur-sm" 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.5 }}
    >
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
      <span className="text-xs font-medium text-slate-400">
        <span className="text-white font-bold">{count || 0}</span> unique visitors today
      </span>
    </motion.div>
  );
}
