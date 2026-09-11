import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createHash } from "crypto";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await req.json();
  const { data: project } = await supabaseAdmin.from("projects").select("*").eq("id", id).single();
  if (!project || project.user_id !== auth.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await supabaseAdmin.from("verification_logs").delete().eq("project_id", id);
  const scopeKey = createHash("sha256").update(project.api_key).digest("hex");
  await supabaseAdmin.from("rate_limit_events").delete().in("scope_key", [project.api_key, scopeKey]);
  await supabaseAdmin.from("project_members").delete().eq("project_id", id);
  await supabaseAdmin.from("team_invitations").delete().eq("project_id", id);
  await supabaseAdmin.from("projects").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
