"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function BackButton({ fallback = "/", label = "Back", className = "" }: { fallback?: string; label?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;
  return <button type="button" onClick={() => { if (window.history.length > 1) router.back(); else router.push(fallback); }} aria-label={label} className={`inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-400 transition hover:border-blue-500/40 hover:bg-slate-800 hover:text-white ${className}`}><ArrowLeft className="h-4 w-4" />{label}</button>;
}
