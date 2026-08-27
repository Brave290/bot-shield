"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

// 1. V6 Card: Subtle hover lift + border glow
export function V6Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.5)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-sm p-6 transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
}

// 2. V6 Skeleton: Smooth pulse for fast-load perception
export function V6Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-800/50 ${className}`} />;
}

// 3. V6 Stagger: Staggered entrance for lists/grids
export function V6Stagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function V6StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
      }}
    >
      {children}
    </motion.div>
  );
}

// 4. V6 Tab Content: Smooth crossfade between admin tabs
export function V6TabContent({ children, isActive }: { children: ReactNode; isActive: boolean }) {
  if (!isActive) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
