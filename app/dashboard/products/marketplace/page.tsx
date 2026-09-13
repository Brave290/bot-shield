"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Download, Search, Filter, CheckCircle, ExternalLink } from "lucide-react";

type MarketplaceItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  installed: boolean;
  featured: boolean;
};

const mockItems: MarketplaceItem[] = [
  { id: "m1", name: "Advanced Bot Fingerprinting", description: "Deep browser fingerprinting with canvas, WebGL, and audio context analysis.", category: "Detection", price: 29, rating: 4.8, downloads: 12400, installed: true, featured: true },
  { id: "m2", name: "Geolocation Intelligence", description: "Real-time IP geolocation with VPN and proxy detection.", category: "Intelligence", price: 19, rating: 4.6, downloads: 8900, installed: false, featured: false },
  { id: "m3", name: "Behavioral Biometrics", description: "Mouse movement and keystroke dynamics analysis for human verification.", category: "Detection", price: 49, rating: 4.9, downloads: 6700, installed: false, featured: true },
  { id: "m4", name: "Threat Intelligence Feed", description: "Real-time feed of known malicious IPs and domains.", category: "Intelligence", price: 39, rating: 4.7, downloads: 15200, installed: true, featured: false },
  { id: "m5", name: "Custom Rule Engine", description: "Build and deploy custom detection rules with a visual editor.", category: "Tools", price: 59, rating: 4.5, downloads: 4300, installed: false, featured: false },
  { id: "m6", name: "Compliance Scanner", description: "Automated compliance checks for SOC 2, GDPR, and PCI DSS.", category: "Compliance", price: 79, rating: 4.4, downloads: 3200, installed: false, featured: false },
];

const categories = ["All", "Detection", "Intelligence", "Tools", "Compliance"];

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function MarketplacePage() {
  const [items] = useState<MarketplaceItem[]>(mockItems);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardShell userType="user">
      <div className="space-y-6 sm:space-y-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <div className="mb-3 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Add-ons & Integrations</p>
            <span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Marketplace</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Marketplace</h1>
          <p className="mt-1 text-slate-400">Extend BotShield with powerful add-ons, integrations, and intelligence feeds.</p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" initial="hidden" animate="visible" variants={fadeIn}>
          {[["Total Items", items.length, "blue"], ["Installed", items.filter((i) => i.installed).length, "emerald"], ["Featured", items.filter((i) => i.featured).length, "violet"], ["Categories", categories.length - 1, "amber"]].map(([label, value, color]) => (
            <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40">
              <div className={`mb-4 h-1 w-10 rounded-full bg-${color}-500`} />
              <p className="text-xs uppercase tracking-wider text-slate-500">{String(label)}</p>
              <p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p>
            </div>
          ))}
        </motion.div>

        {/* Search and Filter */}
        <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" initial="hidden" animate="visible" variants={fadeIn}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search marketplace..." className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-1">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${selectedCategory === cat ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>{cat}</button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Items Grid */}
        <motion.section initial="hidden" animate="visible" variants={fadeIn}>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <motion.div key={item.id} className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-blue-500/50 hover:bg-slate-900" whileHover={{ y: -2 }}>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 transition group-hover:bg-blue-500/20">
                    <ShoppingBag className="h-6 w-6 text-blue-400" />
                  </div>
                  {item.featured && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">Featured</span>}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-400 line-clamp-2">{item.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{item.rating}</span>
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" />{item.downloads.toLocaleString()}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-400">{item.category}</span>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-lg font-bold text-white">{item.price === 0 ? "Free" : `$${item.price}/mo`}</span>
                  {item.installed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
                      <CheckCircle className="h-4 w-4" /> Installed
                    </span>
                  ) : (
                    <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
                      <Download className="h-4 w-4" /> Install
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 py-20 text-center">
              <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-600" />
              <h3 className="mb-2 text-lg font-semibold text-white">No items found</h3>
              <p className="text-slate-400">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </motion.section>
      </div>
    </DashboardShell>
  );
}
