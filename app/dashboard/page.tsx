"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { ProjectsView } from "@/components/dashboard/projects-view";
import { SdkView } from "@/components/dashboard/sdk-view";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"projects" | "sdk">("projects");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      
      setUser(user);
      
      // Fetch projects
      const { data } = await supabase.from("projects").select("*").eq("user_id", user.id);
      setProjects(data || []);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Determine which view to show based on URL params or state
  const showSdk = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "sdk";

  return (
    <DashboardShell userType="user" userName={user?.email} onLogout={handleLogout}>
      <div className="space-y-8">
        {/* Simple internal navigation for User Dashboard */}
        <div className="flex gap-2 border-b border-slate-800 pb-4">
          <button 
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showSdk ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Projects
          </button>
          <button 
            onClick={() => setActiveTab("sdk")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showSdk ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"}`}
          >
            SDK & Integration
          </button>
        </div>

        {showSdk || activeTab === "sdk" ? (
          <SdkView publicKey={projects[0]?.api_key || ""} />
        ) : (
          <ProjectsView projects={projects} loading={loading} />
        )}
      </div>
    </DashboardShell>
  );
}
