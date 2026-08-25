"use client";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/site";

export function MaintenanceGate({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const bypass = pathname.startsWith("/admin") || pathname.startsWith("/login");
  if (!enabled || bypass) return <>{children}</>;
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6"><Icons.Shield className="w-8 h-8" /></div>
        <h1 className="font-serif text-4xl font-bold text-white mb-3">We'll be right back.</h1>
        <p className="text-slate-400 font-light">BotShield is undergoing scheduled maintenance. Your protection data is safe; the console returns shortly.</p>
      </div>
    </main>
  );
}
