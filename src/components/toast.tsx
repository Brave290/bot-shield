"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Toast = { id: number; kind: "success" | "error" | "info"; msg: string };

export function toast(kind: Toast["kind"], msg: string) {
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { kind, msg } }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const { kind, msg } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, kind, msg }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
    window.addEventListener("app-toast", on);
    return () => window.removeEventListener("app-toast", on);
  }, []);
  return (
    <div className="fixed bottom-6 right-6 z-[120] space-y-3 max-w-sm w-[calc(100%-3rem)] sm:w-auto">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            className={`px-5 py-4 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-medium ${t.kind === "success" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : t.kind === "error" ? "bg-red-500/15 border-red-500/40 text-red-300" : "bg-blue-500/15 border-blue-500/40 text-blue-300"}`}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
