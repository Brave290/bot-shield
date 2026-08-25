import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!auth?.user || !projectId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: project } = await supabaseAdmin.from("projects").select("user_id").eq("id", projectId).single();
  if (!project || project.user_id !== auth.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: logs } = await supabaseAdmin.from("verification_logs").select("score,bot_type,status,mode,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(500);
  const total = logs?.length || 0;
  const blocked = logs?.filter((l) => l.status === "blocked").length || 0;
  const byType: Record<string, number> = {};
  (logs || []).forEach((l) => { byType[l.bot_type] = (byType[l.bot_type] || 0) + 1; });

  return NextResponse.json({ total, blocked, passed: total - blocked, byType, recent: logs?.slice(0, 20) || [] });
}
