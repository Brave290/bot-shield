"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { CustomSelect } from "@/components/custom-select";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [sensitivity, setSensitivity] = useState("balanced");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    setSaving(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      router.push("/login");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch("/api/projects/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionData.session?.access_token || ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, origin: domain.trim(), sensitivity }),
    });
    const data = await response.json().catch(() => null);
    const insertError = response.ok ? null : { message: data?.error || "Unable to create project" };

    if (insertError || !data) {
      setError(insertError?.message || "Unable to create project. Please try again.");
      setSaving(false);
      return;
    }

    router.push(`/dashboard/${data.id}`);
  }

  return (
    <DashboardShell userType="user" userName="User">
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => router.push("/dashboard")} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create a project</h1>
          <p className="text-slate-400 mt-2">Set up a BotShield project for your website.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-5">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-slate-300 mb-2">Project name</label>
            <input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="My website" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label htmlFor="project-domain" className="block text-sm font-medium text-slate-300 mb-2">Website domain <span className="text-slate-600">(optional)</span></label>
            <input id="project-domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="https://example.com" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="sensitivity" className="block text-sm font-medium text-slate-300 mb-2">Detection sensitivity</label>
            <CustomSelect id="sensitivity" value={sensitivity} onChange={(event) => setSensitivity(event.target.value)}>
              <option value="strict">Strict</option>
              <option value="balanced">Balanced</option>
              <option value="loose">Loose</option>
            </CustomSelect>
          </div>
          {error && <p role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}
          <button type="submit" disabled={saving} className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? "Creating..." : "Create project"}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}

export const dynamic = "force-dynamic";
