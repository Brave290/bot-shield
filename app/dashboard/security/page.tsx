"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { StatCard, Select, Badge } from "@/components/ui/form";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { motion } from "framer-motion";
import { Lock, Shield, Globe, Bell, AlertTriangle, Loader2, Plus, Trash2, Eye, EyeOff, CheckCircle2, XCircle, Settings } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Rule = { id: string; name: string; action: string; priority: number; enabled: boolean; pattern?: string; country?: string; bot_type?: string; created_at: string };
type ThreatEvent = { id: string; ip_hash?: string; bot_type?: string; score?: number; country?: string; action?: string; created_at: string };
type SecurityData = { rules: Rule[]; recentThreats: ThreatEvent[]; stats: { rules: number; blocked: number; quarantined: number; whitelisted: number } };

export default function SecurityCenter() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleAction, setRuleAction] = useState("block");
  const [rulePattern, setRulePattern] = useState("");
  const [ruleCountry, setRuleCountry] = useState("");
  const [ruleBotType, setRuleBotType] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const [rulesRes, threatsRes] = await Promise.all([
        fetch("/api/rules", { headers: { Authorization: `Bearer ${sess.session?.access_token || ""}` } }),
        fetch("/api/logs?limit=50", { headers: { Authorization: `Bearer ${sess.session?.access_token || ""}` } }),
      ]);
      const rulesBody = rulesRes.ok ? await rulesRes.json().catch(() => ({ rules: [] })) : { rules: [] };
      const threatsBody = threatsRes.ok ? await threatsRes.json().catch(() => []) : [];
      const rules = Array.isArray(rulesBody?.rules) ? rulesBody.rules : Array.isArray(rulesBody) ? rulesBody : [];
      const threats = Array.isArray(threatsBody) ? threatsBody : Array.isArray(threatsBody?.logs) ? threatsBody.logs : [];
      setData({
        rules,
        recentThreats: threats.slice(0, 20),
        stats: {
          rules: rules.length,
          blocked: rules.filter((r: Rule) => r.action === "block").length,
          quarantined: rules.filter((r: Rule) => r.action === "quarantine").length,
          whitelisted: rules.filter((r: Rule) => r.action === "allow").length,
        },
      });
    } catch { setData({ rules: [], recentThreats: [], stats: { rules: 0, blocked: 0, quarantined: 0, whitelisted: 0 } }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateRule = async () => {
    if (!ruleName.trim()) return;
    setCreating(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token || ""}` },
        body: JSON.stringify({ name: ruleName.trim(), action: ruleAction, priority: data?.rules.length || 0, pattern: rulePattern.trim() || undefined, country: ruleCountry.trim() || undefined, bot_type: ruleBotType.trim() || undefined }),
      });
      setShowRuleModal(false);
      setRuleName(""); setRuleAction("block"); setRulePattern(""); setRuleCountry(""); setRuleBotType("");
      await fetchData();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      await fetch(`/api/rules?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token || ""}` },
        body: JSON.stringify({ enabled: !enabled }),
      });
      await fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteRule = async () => {
    if (!pendingDeleteId) return;
    setDeleting(pendingDeleteId);
    try {
      const { data: sess } = await supabase.auth.getSession();
      await fetch(`/api/rules?id=${pendingDeleteId}`, { method: "DELETE", headers: { Authorization: `Bearer ${sess.session?.access_token || ""}` } });
      setShowDeleteModal(false);
      setPendingDeleteId(null);
      await fetchData();
    } catch (err) { console.error(err); }
    finally { setDeleting(null); }
  };

  if (loading || !data) return (
    <DashboardShell userType="user">
      <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
    </DashboardShell>
  );

  return (
    <DashboardShell userType="user">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Security</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Security Center</h1>
            <p className="mt-1 text-sm text-slate-400">Manage rules, review threats, and enforce your protection policy.</p>
          </div>
          <button onClick={() => setShowRuleModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
            <Plus className="w-4 h-4" /> Create Rule
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Rules" value={data.stats.rules} color="bg-blue-500" />
          <StatCard label="Blocking" value={data.stats.blocked} color="bg-red-500" />
          <StatCard label="Quarantined" value={data.stats.quarantined} color="bg-amber-500" />
          <StatCard label="Whitelisted" value={data.stats.whitelisted} color="bg-emerald-500" />
        </div>

        {/* Rules */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Protection Rules</h2>
            <Badge variant="info">{data.rules.length} rules</Badge>
          </div>
          {data.rules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
              <Lock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">No custom rules yet. Create your first rule to start customizing protection.</p>
              <button onClick={() => setShowRuleModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors">
                <Plus className="w-4 h-4" /> Create Rule
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {data.rules.map((rule) => (
                <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <button onClick={() => handleToggleRule(rule.id, rule.enabled)} className={`w-10 h-6 rounded-full transition-colors relative ${rule.enabled ? "bg-blue-600" : "bg-slate-700"}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${rule.enabled ? "left-5" : "left-1"}`} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{rule.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant={rule.action === "block" ? "danger" : rule.action === "quarantine" ? "warning" : "success"}>{rule.action}</Badge>
                        {rule.pattern && <span className="text-xs text-slate-500 font-mono">{rule.pattern}</span>}
                        {rule.country && <Badge variant="info">{rule.country}</Badge>}
                        {rule.bot_type && <Badge variant="warning">{rule.bot_type}</Badge>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setPendingDeleteId(rule.id); setShowDeleteModal(true); }} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Threats */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">Recent Threat Activity</h2>
            <Badge variant="danger">{data.recentThreats.length} events</Badge>
          </div>
          {data.recentThreats.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No threats detected yet. Once traffic flows, events will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Country</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {data.recentThreats.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 text-slate-400 font-mono text-xs">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="py-3"><Badge variant="danger">{t.bot_type || "unknown"}</Badge></td>
                      <td className="py-3 text-white">{t.score ?? "—"}</td>
                      <td className="py-3 text-slate-400 uppercase">{t.country || "—"}</td>
                      <td className="py-3"><Badge variant={t.action === "blocked" ? "danger" : t.action === "allowed" ? "success" : "warning"}>{t.action || "logged"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Rule Modal */}
      <Modal open={showRuleModal} onClose={() => setShowRuleModal(false)} title="Create Protection Rule" description="Define a rule to block, allow, or quarantine traffic matching specific patterns.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Rule name</label>
            <input value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" placeholder="e.g. Block known bot user-agent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Action</label>
            <Select value={ruleAction} onChange={setRuleAction} options={[{ value: "block", label: "Block" }, { value: "quarantine", label: "Quarantine (rate limit)" }, { value: "allow", label: "Allow (whitelist)" }]} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Pattern (optional)</label>
            <input value={rulePattern} onChange={(e) => setRulePattern(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" placeholder="Regex pattern to match against" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Country code (optional)</label>
              <input value={ruleCountry} onChange={(e) => setRuleCountry(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" placeholder="e.g. CN" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Bot type (optional)</label>
              <input value={ruleBotType} onChange={(e) => setRuleBotType(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" placeholder="e.g. scraper" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowRuleModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreateRule} disabled={!ruleName.trim() || creating} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors">
              {creating ? "Creating..." : "Create Rule"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setPendingDeleteId(null); }} onConfirm={handleDeleteRule} title="Delete this rule?" message="Traffic matching this rule will no longer be affected. This cannot be undone." confirmLabel={deleting ? "Deleting..." : "Delete rule"} danger loading={!!deleting} />
    </DashboardShell>
  );
}
