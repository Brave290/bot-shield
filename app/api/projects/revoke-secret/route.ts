import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { projectId, keyType } = await req.json().catch(() => ({}));
  const { data: project } = await supabaseAdmin.from("projects").select("id,user_id,secret_key,previous_secret_key").eq("id", projectId).eq("user_id", auth.user.id).single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const field = keyType === "previous" ? "previous_secret_key_revoked_at" : "secret_key_revoked_at";
  const { error } = await supabaseAdmin.from("projects").update({ [field]: new Date().toISOString() }).eq("id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, revoked: keyType === "previous" ? "previous" : "current" });
}
