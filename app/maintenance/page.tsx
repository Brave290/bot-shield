"use client";
import { Icons } from "@/components/site";
// ADMIN IP WHITELIST (activate with admin dashboard):
// const ip = (await headers()).get("x-forwarded-for")?.split(",")[0];
// if (ADMIN_IPS.includes(ip)) redirect("/dashboard");
export default function Maintenance() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-slate-950 to-slate-950" />
      <div className="relative max-w-2xl text-center">
        <div className="mx-auto w-24 h-24 rounded-full border border-blue-500/30 flex items-center justify-center mb-10 relative">
          <span className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" style={{ animationDuration: "2.5s" }} />
          <span className="text-blue-400"><Icons.Shield className="w-10 h-10" /></span>
        </div>
        <p className="text-xs tracking-[0.35em] uppercase text-blue-400 mb-6">Scheduled maintenance</p>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight">Sharpening <span className="italic text-blue-400">the shield.</span></h1>
        <p className="mt-8 text-lg text-slate-400 font-light">We are upgrading infrastructure. Expected downtime under two hours. Your data and tokens remain safe.</p>
        <div className="mt-10 max-w-md mx-auto">
          <div className="flex justify-between text-xs text-slate-500 mb-2"><span>Migration progress</span><span>65%</span></div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full w-[65%] rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" /></div>
        </div>
        <p className="mt-12 text-sm text-slate-500 font-light">Urgent? <a className="text-blue-400" href="mailto:info.bravehx@gmail.com">info.bravehx@gmail.com</a> · <a className="text-blue-400" href="https://t.me/bravehx">Telegram @bravehx</a></p>
      </div>
    </div>
  );
}
