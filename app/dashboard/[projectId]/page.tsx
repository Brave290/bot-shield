"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { SdkView } from "@/components/dashboard/sdk-view";
import { ask } from "@/components/confirm";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  Shield, 
  Key, 
  Globe, 
  Activity, 
  Settings,
  Trash2,
  Copy,
  Check
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function ProjectDetailContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"overview" | "sdk" | "settings">("overview");
  const [copied, setCopied] = useState(false);
  const [origins, setOrigins] = useState("");
  const [savingOrigins, setSavingOrigins] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();
      
      if (data) { setProject(data); setOrigins((data.allowed_origins || []).join("\n")); }
      setLoading(false);
    };
    fetchProject();
  }, [projectId, router]);

  const handleDelete = async () => {
    const confirmed = await ask({
      title: "Delete this project?",
      message: `This permanently deletes ${project.name}, its verification logs, and rate-limit history. This action cannot be undone.`,
      confirmLabel: "Delete project",
      danger: true,
    });
    if (!confirmed) return;
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch("/api/projects/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId }),
    });
    if (!response.ok) return;
    router.push("/dashboard");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveOrigins = async () => {
    setSavingOrigins(true);
    const allowed_origins = origins.split(/[\n,]/).map((value) => value.trim().replace(/\/$/, "")).filter(Boolean);
    const { error } = await supabase.from("projects").update({ allowed_origins }).eq("id", projectId);
    if (!error) setProject((current: any) => ({ ...current, allowed_origins }));
    setSavingOrigins(false);
  };

  if (loading) {
    return (
      <DashboardShell userType="user" userName="Loading...">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="h-32 bg-slate-800 rounded" />
        </div>
      </DashboardShell>
    );
  }

  if (!project) {
    return (
      <DashboardShell userType="user" userName="User">
        <div className="text-center py-20">
          <h2 className="text-xl text-white mb-4">Project not found</h2>
          <button onClick={() => router.push("/dashboard")} className="text-blue-400 hover:text-blue-300">
            ← Back to Projects
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userType="user" userName={project.user_email || "User"}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Shield className="w-7 h-7 text-blue-500" />
                {project.name}
              </h1>
              <p className="text-slate-400 text-sm mt-1">{project.domain}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              project.status === "active" 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}>
              {project.status || "Active"}
            </span>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-2 border-b border-slate-800">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "sdk", label: "SDK & Integration", icon: Key },
            { id: "settings", label: "Settings", icon: Settings }
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === section.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-slate-400">Total Requests</span>
                </div>
                <p className="text-3xl font-bold text-white">0</p>
                <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
              </div>
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-slate-400">Bots Blocked</span>
                </div>
                <p className="text-3xl font-bold text-white">0</p>
                <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
              </div>
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-slate-400">Success Rate</span>
                </div>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
              </div>
            </div>

            {/* API Keys */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">API Keys</h3>
              
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-400">Public API Key</label>
                    <button 
                      onClick={() => copyToClipboard(project.api_key)}
                      className="text-slate-400 hover:text-white"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <code className="block bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-blue-400 font-mono text-sm break-all">
                    {project.api_key}
                  </code>
                  <p className="text-xs text-slate-500 mt-2">Safe to expose in frontend code</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-400">Secret Key</label>
                    <button
                      onClick={() => copyToClipboard(project.secret_key)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                      aria-label="Copy secret key"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <code className="block bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-600 font-mono text-sm blur-sm hover:blur-0 transition-all cursor-pointer" onClick={() => copyToClipboard(project.secret_key)}>
                    {project.secret_key}
                  </code>
                  <p className="text-xs text-slate-500 mt-2">⚠️ Never share this. Click to reveal.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "sdk" && (
          <SdkView publicKey={project.api_key} />
        )}

        {activeSection === "settings" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold text-white mb-4">Project Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-2">Project Name</label>
                  <input 
                    type="text" 
                    defaultValue={project.name}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-2">Domain</label>
                  <input 
                    type="text" 
                    defaultValue={project.domain}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-2">Allowed origins</label>
                  <textarea value={origins} onChange={(e) => setOrigins(e.target.value)} rows={3} placeholder="https://your-site.com\nhttp://localhost:3000" className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm text-white focus:border-blue-500 focus:outline-none" />
                  <p className="mt-2 text-xs text-slate-500">One exact origin per line. Leave empty to allow browser origins while testing; production sites should be listed explicitly.</p>
                  <button onClick={saveOrigins} disabled={savingOrigins} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50">{savingOrigins ? "Saving..." : "Save origins"}</button>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectDetailContent />
    </Suspense>
  );
}
