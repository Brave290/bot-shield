"use client";
export function AdminQuickLinks({ onJump }: { onJump: (t: any) => void }) {
  const links = [
    ["Rate limits", "/admin/rate-limits"],
    ["Platform settings", "/admin/settings"],
    ["Analytics", "/dashboard/analytics"],
    ["Playground", "/test"],
    ["Docs", "/docs"],
  ];
  const tabs = [
    ["Project rules", "rules"],
    ["Admins", "admins"],
    ["Audit log", "audit"],
    ["Ping / cron", "ping"],
    ["Messages", "messages"],
  ];
  return (
    <div className="mb-10">
      <p className="text-xs uppercase tracking-widest text-slate-600 mb-3">Quick links</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {links.map(([label, href]) => (
          <a key={href} href={href} className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-blue-500/50 text-sm text-slate-300 hover:text-white text-center">{label}</a>
        ))}
        {tabs.map(([label, t]) => (
          <button key={t} onClick={() => onJump(t)} className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-blue-500/50 text-sm text-slate-300 hover:text-white text-center">{label}</button>
        ))}
      </div>
    </div>
  );
}
