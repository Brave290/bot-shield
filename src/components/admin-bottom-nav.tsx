"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  ["/admin", "Overview", "overview"],
  ["/admin?tab=users", "Users", "users"],
  ["/admin?tab=rules", "Rules", "rules"],
  ["/admin?tab=pricing", "Pricing", "pricing"],
  ["/admin?tab=audit", "Audit", "audit"],
  ["/admin/rate-limits", "Limits", "limits"],
  ["/admin/settings", "Settings", "settings"],
  ["/dashboard/analytics", "Analytics", "analytics"],
] as const;

export function AdminBottomNav() {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  return <nav aria-label="Admin mobile navigation" className="fixed bottom-0 left-0 right-0 z-[90] border-t border-slate-800 bg-[#07101e]/95 px-2 py-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.map(([href, label, id]) => { const url = new URL(href, "https://botshield.local"); const active = pathname === url.pathname && (url.searchParams.get("tab") ? tab === url.searchParams.get("tab") : !tab || pathname !== "/admin"); return <Link key={id} href={href} className={`min-w-[76px] shrink-0 rounded-xl px-2 py-2 text-center text-[10px] font-medium transition ${active ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30" : "text-slate-500 hover:bg-slate-900 hover:text-white"}`}>{label}</Link>; })}</div></nav>;
}
