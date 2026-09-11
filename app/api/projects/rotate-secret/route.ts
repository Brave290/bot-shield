import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { projectId } = await req.json().catch(() => ({}));
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  const { data: project } = await supabaseAdmin.from("projects").select("id,secret_key").eq("id", projectId).eq("user_id", auth.user.id).single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const secretKey = `bs_sec_${randomUUID().replaceAll("-", "")}`;
  const now = new Date();
  const { error } = await supabaseAdmin.from("projects").update({ previous_secret_key: project.secret_key, previous_secret_key_revoked_at: null, previous_secret_key_expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), secret_key: secretKey, secret_key_revoked_at: null, secret_key_rotated_at: now.toISOString() }).eq("id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ secretKey, previousSecretKey: project.secret_key, message: "Update your backend immediately. The previous key expires in 24 hours or can be revoked sooner." });
}
