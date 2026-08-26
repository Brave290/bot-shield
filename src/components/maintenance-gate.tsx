"use client";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/site";
import { useEffect, useState } from "react";

export function MaintenanceGate({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const [isBypassed, setIsBypassed] = useState(false);

  useEffect(() => {
    // Always bypass admin and login
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
      setIsBypassed(true);
      return;
    }

    // Check if user's IP is whitelisted
    fetch("/api/my-ip")
      .then((r) => r.json())
      .then((data) => {
        // Bypass if IP matches common admin IPs or localhost
        const adminIPs = ["127.0.0.1", "::1", "localhost"];
        // Add your specific IP here or fetch from admin settings
        if (adminIPs.includes(data.ip) || data.ip.startsWith("192.168.") || data.ip.startsWith("10.")) {
          setIsBypassed(true);
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (!enabled || isBypassed) return <>{children}</>;

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6">
          <Icons.Shield className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-white mb-3">We'll be right back.</h1>
        <p className="text-slate-400 font-light">BotShield is undergoing scheduled maintenance. Your protection data is safe; the console returns shortly.</p>
      </div>
    </main>
  );
}
