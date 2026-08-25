import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/toast";
import { ScrollReset } from "@/components/scroll-reset";
import { ConfirmHost } from "@/components/confirm";
import { RouteLoader } from "@/components/route-loader";
import { MaintenanceGate } from "@/components/maintenance-gate";
import { supabaseAdmin } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "500", "600", "700", "800"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "BotShield — Enterprise Bot Detection & Protection",
  description: "Lightweight, AI-powered bot detection API. Protect your website from bots, spam, and fraud without annoying CAPTCHAs.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let maintenance = false;
  try {
    const { data } = await supabaseAdmin.from("platform_settings").select("value").eq("key", "maintenance_mode").single();
    maintenance = data?.value === "on";
  } catch {}
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "history.scrollRestoration='manual';try{window.scrollTo(0,0);}catch(e){}" }} />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased">
        <MaintenanceGate enabled={maintenance}>{children}</MaintenanceGate>
        <Toaster /><ScrollReset /><ConfirmHost /><RouteLoader />
      </body>
    </html>
  );
}
