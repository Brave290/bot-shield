"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Badge, EmptyState, StatCard } from "@/components/ui/form";
import { PlanGate } from "@/components/plan-gate";
import { toast } from "@/components/toast";
import { motion } from "framer-motion";
import {
  BarChart3, Plus, Trash2, Edit, Loader2, AlertTriangle, Filter,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Dashboard = {
  id: string;
  name: string;
  description: string;
  widgets: unknown[];
  is_default: boolean;
  created_at: string;
};

type SavedFilter = {
  id: string;
  name: string;
  config: Record<string, unknown>;
  created_at: string;
};

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AnalyticsProPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateDash, setShowCreateDash] = useState(false);
  const [showCreateFilter, setShowCreateFilter] = useState(false);
  const [editDashboard, setEditDashboard] = useState<Dashboard | null>(null);
  const [deleteDashboard, setDeleteDashboard] = useState<Dashboard | null>(null);
  const [deleteFilter, setDeleteFilter] = useState<SavedFilter | null>(null);

  const [dashName, setDashName] = useState("");
  const [dashDesc, setDashDesc] = useState("");
  const [filterName, setFilterName] = useState("");

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/products/analytics-pro", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load analytics data");
      const data = await res.json();
      setDashboards(data.dashboards || []);
      setFilters(data.filters || []);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const handleCreateDashboard = async () => {
    if (!dashName.trim()) { toast("error", "Dashboard name is required"); return; }
    const token = await getToken();
    const res = await fetch("/api/products/analytics-pro", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-dashboard", name: dashName, description: dashDesc }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to create dashboard"); return; }
    toast("success", "Dashboard created");
    setShowCreateDash(false);
    setDashName("");
    setDashDesc("");
    load();
  };

  const handleEditDashboard = async () => {
    if (!editDashboard) return;
    const token = await getToken();
    const res = await fetch("/api/products/analytics-pro", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-dashboard", dashboard_id: editDashboard.id, name: dashName, description: dashDesc }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to update"); return; }
    toast("success", "Dashboard updated");
    setEditDashboard(null);
    setDashName("");
    setDashDesc("");
    load();
  };

  const handleDeleteDashboard = async () => {
    if (!deleteDashboard) return;
    const token = await getToken();
    const res = await fetch("/api/products/analytics-pro", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-dashboard", dashboard_id: deleteDashboard.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete dashboard"); return; }
    toast("success", "Dashboard deleted");
    setDeleteDashboard(null);
    load();
  };

  const handleCreateFilter = async () => {
    if (!filterName.trim()) { toast("error", "Filter name is required"); return; }
    const token = await getToken();
    const res = await fetch("/api/products/analytics-pro", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save-filter", name: filterName, config: {} }),
    });
    const data = await res.json();
    if (!res.ok) { toast("error", data.error || "Failed to save filter"); return; }
    toast("success", "Filter saved");
    setShowCreateFilter(false);
    setFilterName("");
    load();
  };

  const handleDeleteFilter = async () => {
    if (!deleteFilter) return;
    const token = await getToken();
    const res = await fetch("/api/products/analytics-pro", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-filter", filter_id: deleteFilter.id }),
    });
    if (!res.ok) { toast("error", "Failed to delete filter"); return; }
    toast("success", "Filter deleted");
    setDeleteFilter(null);
    load();
  };

  const openEdit = (d: Dashboard) => {
    setDashName(d.name);
    setDashDesc(d.description);
    setEditDashboard(d);
  };

  return (
    <DashboardShell userType="user">
      <PlanGate feature="analytics-pro" currentPlan="Enterprise">
        <div className="space-y-6 sm:space-y-8">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Advanced Analytics</p>
              <Badge variant="pro">BotShield Analytics Pro</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Analytics Pro</h1>
            <p className="mt-1 text-slate-400">Build custom dashboards and save filters for advanced traffic analysis.</p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <motion.div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center" variants={fadeIn} initial="hidden" animate="visible">
              <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={load} className="mt-3 text-sm text-blue-400 hover:underline">Retry</button>
            </motion.div>
          ) : (
            <>
              <motion.div className="grid grid-cols-2 gap-4 lg:grid-cols-4" variants={fadeIn} initial="hidden" animate="visible">
                <StatCard label="Dashboards" value={dashboards.length} color="bg-blue-500" />
                <StatCard label="Default" value={dashboards.filter((d) => d.is_default).length} color="bg-emerald-500" />
                <StatCard label="Saved Filters" value={filters.length} color="bg-violet-500" />
                <StatCard label="Widgets" value={dashboards.reduce((s, d) => s + (Array.isArray(d.widgets) ? d.widgets.length : 0), 0)} color="bg-amber-500" />
              </motion.div>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Dashboards</h2>
                    <p className="mt-1 text-sm text-slate-400">Create and manage custom analytics dashboards.</p>
                  </div>
                  <button onClick={() => { setDashName(""); setDashDesc(""); setShowCreateDash(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> New Dashboard
                  </button>
                </div>
                {dashboards.length === 0 ? (
                  <EmptyState icon={<BarChart3 className="h-8 w-8 text-slate-500" />} title="No dashboards" description="Create a dashboard to visualize your analytics data." action={
                    <button onClick={() => { setDashName(""); setDashDesc(""); setShowCreateDash(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500">
                      <Plus className="h-4 w-4" /> New Dashboard
                    </button>
                  } />
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {dashboards.map((dash) => (
                      <div key={dash.id} className="group rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-blue-500/40">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-white">{dash.name}</h3>
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{dash.description || "No description"}</p>
                          </div>
                          {dash.is_default && <Badge variant="info">Default</Badge>}
                        </div>
                        <div className="mt-3 text-xs text-slate-600">
                          {Array.isArray(dash.widgets) ? dash.widgets.length : 0} widgets &middot; Created {new Date(dash.created_at).toLocaleDateString()}
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-slate-800 pt-3">
                          <button onClick={() => openEdit(dash)} className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition text-center">Edit</button>
                          <button onClick={() => setDeleteDashboard(dash)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6" variants={fadeIn} initial="hidden" animate="visible">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Saved Filters</h2>
                    <p className="mt-1 text-sm text-slate-400">Quick access to your frequently used filter configurations.</p>
                  </div>
                  <button onClick={() => { setFilterName(""); setShowCreateFilter(true); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                    <Plus className="h-4 w-4" /> Save Filter
                  </button>
                </div>
                {filters.length === 0 ? (
                  <EmptyState icon={<Filter className="h-8 w-8 text-slate-500" />} title="No saved filters" description="Save filter configurations for quick access." />
                ) : (
                  <div className="mt-4 space-y-3">
                    {filters.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                            <Filter className="h-5 w-5 text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{filter.name}</p>
                            <p className="text-xs text-slate-500">Saved {new Date(filter.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button onClick={() => setDeleteFilter(filter)} className="p-2 text-slate-400 hover:text-red-400 transition"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            </>
          )}
        </div>
      </PlanGate>

      <Modal open={showCreateDash} onClose={() => setShowCreateDash(false)} title="Create Dashboard" description="Set up a new analytics dashboard.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input value={dashName} onChange={(e) => setDashName(e.target.value)} placeholder="My Dashboard" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea value={dashDesc} onChange={(e) => setDashDesc(e.target.value)} placeholder="Describe this dashboard..." rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateDash(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreateDashboard} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Create Dashboard</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editDashboard} onClose={() => { setEditDashboard(null); setDashName(""); setDashDesc(""); }} title="Edit Dashboard" description="Update dashboard details.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
            <input value={dashName} onChange={(e) => setDashName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea value={dashDesc} onChange={(e) => setDashDesc(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setEditDashboard(null); setDashName(""); setDashDesc(""); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleEditDashboard} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Save Changes</button>
          </div>
        </div>
      </Modal>

      <Modal open={showCreateFilter} onClose={() => setShowCreateFilter(false)} title="Save Filter" description="Save a new filter configuration.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Filter Name</label>
            <input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Last 7 days, errors only" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateFilter(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreateFilter} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors">Save Filter</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteDashboard} onClose={() => setDeleteDashboard(null)} onConfirm={handleDeleteDashboard} title="Delete Dashboard" message={`Are you sure you want to delete "${deleteDashboard?.name}"?`} confirmLabel="Delete" danger />
      <ConfirmModal open={!!deleteFilter} onClose={() => setDeleteFilter(null)} onConfirm={handleDeleteFilter} title="Delete Filter" message={`Are you sure you want to delete "${deleteFilter?.name}"?`} confirmLabel="Delete" danger />
    </DashboardShell>
  );
}
