"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/site";

type Req = { title: string; message: string; confirmLabel?: string; danger?: boolean; resolve: (v: boolean) => void };

export function ask(opts: { title: string; message: string; confirmLabel?: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent("app-confirm", { detail: { ...opts, resolve } }));
  });
}

export function ConfirmHost() {
  const [req, setReq] = useState<Req | null>(null);
  useEffect(() => {
    const on = (e: Event) => setReq((e as CustomEvent).detail as Req);
    window.addEventListener("app-confirm", on);
    return () => window.removeEventListener("app-confirm", on);
  }, []);
  const close = (v: boolean) => { req?.resolve(v); setReq(null); };
  return (
    <AnimatePresence>
      {req && (
        <motion.div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(false)}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md p-7 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${req.danger ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}><Icons.Shield className="w-6 h-6" /></div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">{req.title}</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed mb-7">{req.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => close(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-sm text-slate-300">Cancel</button>
              <button onClick={() => close(true)} className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white ${req.danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"}`}>{req.confirmLabel || "Confirm"}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
