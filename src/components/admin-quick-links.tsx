"use client";
export function AdminQuickLinks({ onJump }: { onJump: (t: any) => void }) {
  const links = [
    ["Rate limits", "/admin/rate-limits", "⚡"],
    ["Settings", "/admin/settings", "⚙️"],
    ["Analytics", "/dashboard/analytics", "📊"],
    ["Playground", "/test", "🧪"],
    ["Docs", "/docs", "📚"],
  ];
  const tabs = [
    ["Rules", "rules", "🛡️"],
    ["Admins", "admins", "👥"],
    ["Audit", "audit", "🧾"],
    ["Ping", "ping", "📡"],
    ["Messages", "messages", "✉️"],
  ];
  const pill = "shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/60 hover:border-blue-500/60 hover:bg-blue-500/10 text-xs text-slate-300 hover:text-white transition-colors";
  return (
    <div className="mb-8">
      <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
        {links.map(([label, href, icon]) => (
          <a key={href} href={href} className={pill}><span className="text-sm">{icon}</span>{label}</a>
        ))}
        <span className="w-px self-stretch bg-slate-800 mx-1 shrink-0" />
        {tabs.map(([label, t, icon]) => (
          <button key={t} onClick={() => onJump(t)} className={pill}><span className="text-sm">{icon}</span>{label}</button>
        ))}
      </div>
    </div>
  );
}
