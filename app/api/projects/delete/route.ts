import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await req.json();
  const { data: project } = await supabaseAdmin.from("projects").select("*").eq("id", id).single();
  if (!project || project.user_id !== auth.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await supabaseAdmin.from("verification_logs").delete().eq("project_id", id);
  await supabaseAdmin.from("rate_limit_events").delete().eq("scope_key", project.api_key);
  await supabaseAdmin.from("projects").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
