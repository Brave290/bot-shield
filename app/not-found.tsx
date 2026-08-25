import Link from "next/link";
import { Icons } from "@/components/site";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-25">
        <div className="relative w-[520px] h-[520px]">
          <div className="absolute inset-0 rounded-full border border-blue-500/30" />
          <div className="absolute inset-16 rounded-full border border-blue-500/25" />
          <div className="absolute inset-32 rounded-full border border-blue-500/20" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400" />
        </div>
      </div>
      <div className="relative max-w-2xl text-center">
        <p className="text-xs tracking-[0.35em] uppercase text-blue-400 mb-6">Error 404 — signal lost</p>
        <h1 className="font-serif text-6xl md:text-8xl font-bold text-white leading-none">Nothing on <span className="italic text-blue-400">this frequency.</span></h1>
        <p className="mt-8 text-lg text-slate-400 font-light">The page you requested does not exist, was moved, or never left the design review.</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium">Return to base<Icons.ArrowRight className="w-4 h-4" /></Link>
          <Link href="/docs" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-white font-medium">Browse documentation</Link>
        </div>
      </div>
    </div>
  );
}
