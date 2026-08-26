import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const uid = auth.user.id;

  const { data: projects } = await supabaseAdmin.from("projects").select("id, api_key").eq("user_id", uid);
  for (const p of projects || []) {
    await supabaseAdmin.from("verification_logs").delete().eq("project_id", p.id);
    await supabaseAdmin.from("rate_limit_events").delete().eq("scope_key", p.api_key);
  }
  if (projects?.length) await supabaseAdmin.from("projects").delete().eq("user_id", uid);
  await supabaseAdmin.from("subscription_stats").delete().eq("user_id", uid);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
