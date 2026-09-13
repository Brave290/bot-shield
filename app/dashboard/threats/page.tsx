"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/toast";
import { Plus, Trash2, Globe, Server, ShieldBan, ToggleLeft, ToggleRight } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type ThreatEntry = { id: string; list_type: string; value: string; label: string; enabled: boolean; created_at: string };
type ListType = "ip_blocklist" | "ip_allowlist" | "country_blocklist" | "asn_blocklist";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const listTypes: { id: ListType; label: string; icon: any; placeholder: string }[] = [
  { id: "ip_blocklist", label: "IP Blocklist", icon: ShieldBan, placeholder: "192.168.1.1" },
  { id: "ip_allowlist", label: "IP Allowlist", icon: ToggleRight, placeholder: "10.0.0.1" },
  { id: "country_blocklist", label: "Country Blocklist", icon: Globe, placeholder: "US, CN, RU" },
  { id: "asn_blocklist", label: "ASN Blocklist", icon: Server, placeholder: "AS15169" },
];

export default function ThreatsPage() {
  const [entries, setEntries] = useState<ThreatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListType>("ip_blocklist");
  const [showForm, setShowForm] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/threats", { headers: { Authorization: `Bearer ${auth.session?.access_token || ""}` } });
    if (res.ok) {
      const body = await res.json();
      setEntries(body.entries || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const add = async () => {
    if (!newValue.trim()) return toast("error", "Enter a value");
    setCreating(true);
    const { data: auth } = await supabase.auth.getSession();
    const res = await fetch("/api/threats", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ list_type: activeTab, value: newValue.trim(), label: label.trim() || undefined }),
    });
    const result = await res.json();
    if (!res.ok) return toast("error", result.error || "Failed to add entry");
    toast("success", "Entry added");
    setNewValue("");
    setLabel("");
    setShowForm(false);
    await load();
    setCreating(false);
  };

  const remove = async (id: string) => {
    const { data: auth } = await supabase.auth.getSession();
    await fetch("/api/threats", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast("success", "Entry removed");
    await load();
  };

  const toggle = async (entry: ThreatEntry) => {
    const { data: auth } = await supabase.auth.getSession();
    await fetch("/api/threats", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, enabled: !entry.enabled }),
    });
    await load();
  };

  const filtered = entries.filter((e) => e.list_type === activeTab && (e.value.toLowerCase().includes(search.toLowerCase()) || e.label?.toLowerCase().includes(search.toLowerCase())));
  const activeConfig = listTypes.find((l) => l.id === activeTab)!;

  if (loading) {
    return (
      <DashboardShell userType="user">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Threat intelligence</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Threat Lists</h1>
              <p className="mt-1 text-slate-400">Manage IP, country, and ASN blocklists and allowlists.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25">
              <Plus className="h-4 w-4" /> Add Entry
            </button>
          </div>
        </motion.div>

        <motion.nav variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-1">
          {listTypes.map(({ id, label, icon: Icon }) => {
            const count = entries.filter((e) => e.list_type === id).length;
            return (
              <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeTab === id ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <Icon className="h-4 w-4" /> {label}
                <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{count}</span>
              </button>
            );
          })}
        </motion.nav>

        {showForm && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Add to {activeConfig.label}</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={activeConfig.placeholder} className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional label" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none sm:w-48" />
              <button onClick={add} disabled={creating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
                {creating ? "Adding..." : "Add"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-400 transition hover:text-white">Cancel</button>
            </div>
          </motion.section>
        )}

        <motion.section variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-white">{activeConfig.label}</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..." className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none sm:w-64" />
          </div>
          {filtered.length === 0 ? (
            <div className="mt-8 rounded-xl border-2 border-dashed border-slate-800 py-12 text-center">
              <ShieldBan className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">No entries in this list.</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3 pr-4">Value</th>
                    <th className="pb-3 pr-4">Label</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.map((entry, i) => (
                    <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="text-slate-300">
                      <td className="py-3 pr-4 font-mono text-xs text-white">{entry.value}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">{entry.label || "—"}</td>
                      <td className="py-3 pr-4">
                        <button onClick={() => toggle(entry)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${entry.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                          {entry.enabled ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                          {entry.enabled ? "Enabled" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3">
                        <button onClick={() => remove(entry.id)} className="rounded-lg border border-red-500/20 p-1.5 text-red-400 transition hover:bg-red-500/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>
      </div>
    </DashboardShell>
  );
}
