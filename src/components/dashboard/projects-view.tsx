"use client";
import { Shield, Plus, MoreVertical } from "lucide-react";

interface Project {
  id: string;
  name: string;
  domain: string;
  status: "active" | "inactive";
}

interface ProjectsViewProps {
  projects: Project[];
  loading: boolean;
}

export function ProjectsView({ projects, loading }: ProjectsViewProps) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" /> Your Projects
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">No projects yet</h3>
          <p className="text-slate-500 mt-2">Create your first project to start protecting your site.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <button className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Project options">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 truncate">{project.name}</h3>
              <p className="text-sm text-slate-500 truncate mb-4">{project.domain}</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${project.status === "active" ? "bg-green-500" : "bg-slate-600"}`} />
                <span className="text-xs font-medium text-slate-400 capitalize">{project.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
