"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { SdkView } from "@/components/dashboard/sdk-view";
import { ask } from "@/components/confirm";
import { createClient } from "@supabase/supabase-js";
import { Shield, Plus, ArrowRight, Activity, Clock, Loader2, Settings, Code2, Trash2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type DashboardTab = "projects" | "sdk" | "settings";

function UserDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: DashboardTab = requestedTab === "sdk" || requestedTab === "settings" ? requestedTab : "projects";
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<{ tier: string; quota: number; today: number; month: number } | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/login");
          return;
        }

        setUser(user);
        const { data: sessionData } = await supabase.auth.getSession();
        const usageResponse = await fetch("/api/usage", { headers: { Authorization: `Bearer ${sessionData.session?.access_token || ""}` } });
        if (usageResponse.ok) setUsage(await usageResponse.json());
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) console.error("Error fetching projects:", error);
        else setProjects(data || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const setTab = (nextTab: DashboardTab) => {
    router.push(nextTab === "projects" ? "/dashboard" : `/dashboard?tab=${nextTab}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    const confirmed = await ask({
      title: "Delete your account?",
      message: "This permanently deletes your account, projects, logs, and subscription data. This action cannot be undone.",
      confirmLabel: "Delete account",
      danger: true,
    });
    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      });
      if (!response.ok) throw new Error("Unable to delete account");
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error(error);
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell userType="user" userName="Loading...">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardShell>
    );
  }

  const firstProjectKey = projects[0]?.api_key || "";
  const tabs = [
    { id: "projects" as const, label: "Projects", icon: Shield },
    { id: "sdk" as const, label: "SDK & Integration", icon: Code2 },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <DashboardShell userType="user" userName={user?.email} onLogout={handleLogout}>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Workspace</p><span className="rounded-full border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BotShield Cloud</span></div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{tab === "projects" ? "Your protection workspace" : tabs.find((item) => item.id === tab)?.label}</h1>
            <p className="mt-1 text-slate-400">{tab === "projects" ? "Manage your BotShield projects" : tab === "sdk" ? "Connect BotShield to your website in minutes" : "Manage your workspace and account"}</p>
          </div>
          {tab === "projects" && (
            <button onClick={() => router.push("/dashboard/new-project")} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 sm:w-auto">
              <Plus className="h-5 w-5" /> New Project
            </button>
          )}
        </div>

        <nav aria-label="Dashboard sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${tab === id ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        {tab === "projects" && (
          <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[ ["Plan", usage?.tier || "Hobby"], ["Requests today", usage?.today ?? 0], ["This month", usage?.month ?? 0], ["Monthly quota", usage?.quota === -1 ? "Unlimited" : usage?.quota ?? 1000]].map(([label, value], index) => <div key={String(label)} className="group rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 p-5 transition hover:border-blue-500/40"><div className={`mb-4 h-1 w-10 rounded-full ${index === 0 ? "bg-blue-500" : index === 1 ? "bg-emerald-400" : index === 2 ? "bg-violet-400" : "bg-amber-400"}`} /><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 truncate text-2xl font-bold text-white">{String(value)}</p></div>)}
          </div>
          {projects.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900"><Shield className="h-8 w-8 text-slate-600" /></div>
              <h3 className="mb-2 text-xl font-semibold text-white">No projects yet</h3>
              <p className="mx-auto mb-6 max-w-sm text-slate-400">Create your first project to start protecting your website from bots and automated threats.</p>
              <button onClick={() => router.push("/dashboard/new-project")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500"><Plus className="h-5 w-5" /> Create your first project</button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <button key={project.id} onClick={() => router.push(`/dashboard/${project.id}`)} className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-left transition hover:border-blue-500/50 hover:bg-slate-900">
                  <div className="mb-5 flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 transition group-hover:bg-blue-500/20"><Shield className="h-6 w-6 text-blue-400" /></div><ArrowRight className="h-5 w-5 text-slate-600 transition group-hover:text-blue-400" /></div>
                  <h3 className="mb-1 truncate text-lg font-semibold text-white">{project.name}</h3>
                  <p className="mb-5 flex items-center gap-1 truncate text-sm text-slate-400"><Activity className="h-3 w-3" /> {project.domain || "No domain set"}</p>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${project.status === "active" ? "bg-green-500/10 text-green-400" : "bg-slate-800 text-slate-400"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{project.status || "Active"}</span><span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" />{new Date(project.created_at).toLocaleDateString()}</span></div>
                </button>
              ))}
            </div>
          )}
          </>
        )}

        {tab === "sdk" && <SdkView publicKey={firstProjectKey} />}

        {tab === "settings" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-lg font-semibold text-white">Account</h2>
              <p className="mt-2 text-sm text-slate-400">Signed in as {user?.email}</p>
            </section>
            <section className="rounded-2xl border border-red-500/25 bg-red-500/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-lg font-semibold text-white">Delete account</h2><p className="mt-1 max-w-xl text-sm text-slate-400">Remove your account and all projects permanently.</p></div>
                <button onClick={handleDeleteAccount} disabled={deletingAccount} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"><Trash2 className="h-4 w-4" />{deletingAccount ? "Deleting..." : "Delete account"}</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function UserDashboard() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><UserDashboardContent /></Suspense>;
}
