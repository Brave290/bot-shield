"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { toast } from "@/components/toast";
import { motion } from "framer-motion";
import {
  ShoppingBag, Search, Star, Download, CheckCircle, Loader2,
  AlertTriangle, Package, Grid3X3,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MarketplaceItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  purchased: boolean;
  featured: boolean;
};

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async (category?: string, query?: string) => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (query) params.set("q", query);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/products/marketplace${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load marketplace");
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const categories = ["All", ...new Set(items.map((i) => i.category))];

  const filtered = items.filter((item) => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePurchase = async (itemId: string) => {
    setPurchasingId(itemId);
    const token = await getToken();
    const res = await fetch("/api/products/marketplace", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "purchase", item_id: itemId }),
    });
    const data = await res.json();
    setPurchasingId(null);
    if (!res.ok) { toast("error", data.error || "Failed to purchase"); return; }
    toast("success", "Purchase successful!");
    load(selectedCategory, search);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    load(selectedCategory, val);
  };

  const handleCategory = (cat: string) => {
    setSelectedCategory(cat);
    load(cat, search);
  };

  const installedCount = items.filter((i) => i.purchased).length;
  const featuredCount = items.filter((i) => i.featured).length;

  return (
    <DashboardShell userType="user">
      <PlanGate feature="marketplace" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Add-ons & Integrations</p>
              <Badge variant="pro">Marketplace</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Marketplace</h1>
            <p className="mt-1 text-slate-400">Extend BotShield with powerful add-ons, integrations, and intelligence feeds.</p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <motion.div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center" variants={fadeIn} initial="hidden" animate="visible">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={() => load()} className="mt-3 text-sm text-blue-400 hover:underline">Retry</button>
            </motion.div>
          ) : (
            <>
              <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" variants={fadeIn} initial="hidden" animate="visible">
                <StatCard label="Total Items" value={items.length} color="bg-blue-500" />
                <StatCard label="Installed" value={installedCount} color="bg-emerald-500" />
                <StatCard label="Featured" value={featuredCount} color="bg-violet-500" />
                <StatCard label="Categories" value={categories.length - 1} color="bg-amber-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search marketplace..." className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-1">
                    {categories.map((cat) => (
                      <button key={cat} onClick={() => handleCategory(cat)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${selectedCategory === cat ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>{cat}</button>
                    ))}
                  </div>
                </div>
              </motion.section>

              <motion.section initial="hidden" animate="visible" variants={fadeIn}>
                {filtered.length === 0 ? (
                  <EmptyState icon={<ShoppingBag className="h-8 w-8 text-slate-500" />} title="No items found" description="Try adjusting your search or filter criteria." />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((item) => (
                      <motion.div key={item.id} className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-blue-500/50 hover:bg-slate-900" whileHover={{ y: -2 }}>
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 transition group-hover:bg-blue-500/20">
                            <Package className="h-6 w-6 text-blue-400" />
                          </div>
                          {item.featured && <Badge variant="warning">Featured</Badge>}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-white">{item.name}</h3>
                        <p className="mt-1 text-sm text-slate-400 line-clamp-2">{item.description}</p>
                        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{item.rating || "N/A"}</span>
                          <span className="flex items-center gap-1"><Download className="h-3 w-3" />{(item.downloads || 0).toLocaleString()}</span>
                          <Badge variant="default">{item.category}</Badge>
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                          <span className="text-lg font-bold text-white">{!item.price || item.price === 0 ? "Free" : `$${item.price}/mo`}</span>
                          {item.purchased ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
                              <CheckCircle className="h-4 w-4" /> Installed
                            </span>
                          ) : (
                            <button onClick={() => handlePurchase(item.id)} disabled={purchasingId === item.id} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
                              {purchasingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Install
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            </>
          )}
        </div>
      </PlanGate>
    </DashboardShell>
  );
}
