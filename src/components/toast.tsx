"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type Toast = { id: number; kind: "success" | "error" | "info"; msg: string };
export function toast(kind: Toast["kind"], msg: string) { window.dispatchEvent(new CustomEvent("app-toast", { detail: { kind, msg } })); }
const icon = { success: CheckCircle2, error: AlertCircle, info: Info };
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => { const on = (e: Event) => { const { kind, msg } = (e as CustomEvent).detail; const id = Date.now() + Math.random(); setToasts((items) => [...items, { id, kind, msg }]); setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4000); }; window.addEventListener("app-toast", on); return () => window.removeEventListener("app-toast", on); }, []);
  return <div className="fixed bottom-5 right-4 z-[120] w-[calc(100%-2rem)] max-w-sm space-y-3 sm:right-6 sm:w-auto"><AnimatePresence>{toasts.map((item) => { const Icon = icon[item.kind]; return <motion.div key={item.id} initial={{ opacity: 0, y: 12, x: 20, scale: .96 }} animate={{ opacity: 1, y: 0, x: 0, scale: 1 }} exit={{ opacity: 0, x: 20, scale: .96 }} className={`relative overflow-hidden rounded-2xl border bg-[#0b1220]/95 p-4 shadow-2xl backdrop-blur-xl ${item.kind === "success" ? "border-emerald-500/30" : item.kind === "error" ? "border-red-500/30" : "border-blue-500/30"}`}><div className="flex items-start gap-3"><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.kind === "success" ? "text-emerald-400" : item.kind === "error" ? "text-red-400" : "text-blue-400"}`} /><p className="flex-1 text-sm leading-relaxed text-slate-200">{item.msg}</p><button aria-label="Dismiss notification" onClick={() => setToasts((items) => items.filter((x) => x.id !== item.id))} className="text-slate-600 hover:text-white"><X className="h-4 w-4" /></button></div><div className={`absolute bottom-0 left-0 h-0.5 w-full origin-left animate-[toast-progress_4s_linear_forwards] ${item.kind === "success" ? "bg-emerald-400" : item.kind === "error" ? "bg-red-400" : "bg-blue-400"}`} /></motion.div>; })}</AnimatePresence></div>;
}
