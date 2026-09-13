"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Modal } from "@/components/ui/modal";
import { Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { Plus, Trash2, Globe, Server, ShieldBan, Search, XCircle, ToggleRight, ToggleLeft } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type ThreatEntry = { id: string; list_type: string; value: string; label: string; expires_at: string | null; created_at: string };
type ListType = "ip" | "country" | "asn";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const listTypes: { id: ListType; label: string; icon: any; placeholder: string; description: string }[] = [
  { id: "ip", label: "IP Addresses", icon: ShieldBan, placeholder: "192.168.1.1", description: "Block or allow specific IP addresses" },
  { id: "country", label: "Countries", icon: Globe, placeholder: "US, CN, RU", description: "Block traffic by country code" },
  { id: "asn", label: "ASN Networks", icon: Server, placeholder: "AS15169", description: "Block by autonomous system number" },
];

export default function ThreatsPage() {
  const [entries, setEntries] = useState<ThreatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ListType>("ip");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [form, setForm] = useState({ value: "", label: "", expires_at: "" });

  const load = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/threat-lists", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
      if (res.ok) setEntries(await res.json());
      else setError("Failed to load threat lists");
    } catch { setError("Failed to load data"); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!form.value.trim()) return toast("error", "Enter a value");
    setAdding(true);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch("/api/threat-lists", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          list_type: activeTab,
          value: form.value.trim(),
          label: form.label.trim() || undefined,
          expires_at: form.expires_at || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) return toast("error", result.error || "Failed to add entry");
      toast("success", "Entry added to list");
      setForm({ value: "", label: "", expires_at: "" });
      setShowAdd(false);
      await load();
    } finally { setAdding(false); }
  };

  const remove = async (id: string) => {
    setRemoving(id);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const res = await fetch(`/api/threat-lists?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` },
      });
      if (res.ok) { toast("success", "Entry removed"); await load(); }
      else toast("error", "Failed to remove entry");
    } finally { setRemoving(null); }
  };

  const filtered = entries.filter((e) => e.list_type === activeTab && (e.value.toLowerCase().includes(search.toLowerCase()) || e.label?.toLowerCase().includes(search.toLowerCase())));
  const activeConfig = listTypes.find((l) => l.id === activeTab)!;
  const tabCounts = listTypes.map((t) => ({ ...t, count: entries.filter((e) => e.list_type === t.id).length }));

  if (loading) {
    return (
      <DashboardShell userType="user">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell userType="user">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-lg font-semibold text-white">Failed to load threat lists</p>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); void load(); }} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition">Retry</button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user" userPlan="Pro">
      <PlanGate feature="threats" currentPlan="Pro">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Threat intelligence</p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Threat Lists</h1>
                <p className="mt-1 text-slate-400">Manage IP, country, and ASN blocklists and allowlists.</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
                <Plus className="h-4 w-4" /> Add Entry
              </button>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="IP Addresses" value={entries.filter((e) => e.list_type === "ip").length} color="bg-blue-500" />
            <StatCard label="Countries" value={entries.filter((e) => e.list_type === "country").length} color="bg-cyan-500" />
            <StatCard label="ASN Networks" value={entries.filter((e) => e.list_type === "asn").length} color="bg-violet-500" />
          </div>

          <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`Add to ${activeConfig.label}`} description={activeConfig.description}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Value</label>
                <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={activeConfig.placeholder} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Label (optional)</label>
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Known scraper" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Expires at (optional)</label>
                <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={add} disabled={adding} className="px-5 py-2 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors">
                  {adding ? "Adding..." : "Add entry"}
                </button>
              </div>
            </div>
          </Modal>

          <motion.nav variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-1">
            {tabCounts.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === id ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <Icon className="h-4 w-4" /> {label}
                <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{count}</span>
              </button>
            ))}
          </motion.nav>

          <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">{activeConfig.label}</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..." className="rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none sm:w-64" />
              </div>
            </div>
            {filtered.length === 0 ? (
              <EmptyState icon={<ShieldBan className="h-8 w-8 text-slate-600" />} title={`No ${activeConfig.label.toLowerCase()}`} description={search ? "No entries match your search." : `Add entries to the ${activeConfig.label.toLowerCase()} list.`} action={!search ? <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition"><Plus className="h-4 w-4" /> Add Entry</button> : undefined} />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-4">Value</th>
                      <th className="pb-3 pr-4">Label</th>
                      <th className="pb-3 pr-4">Expires</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <AnimatePresence>
                      {filtered.map((entry, i) => (
                        <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }} className="text-slate-300">
                          <td className="py-3 pr-4 font-mono text-xs text-white">{entry.value}</td>
                          <td className="py-3 pr-4 text-xs text-slate-400">{entry.label || "—"}</td>
                          <td className="py-3 pr-4 text-xs text-slate-500">{entry.expires_at ? new Date(entry.expires_at).toLocaleDateString() : "Never"}</td>
                          <td className="py-3">
                            <button onClick={() => remove(entry.id)} disabled={removing === entry.id} className="rounded-lg border border-red-500/20 p-1.5 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </motion.section>
        </div>
      </PlanGate>
    </DashboardShell>
  );
}
