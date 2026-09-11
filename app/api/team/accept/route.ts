import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { inviteToken } = await req.json().catch(() => ({}));
  if (!inviteToken) return NextResponse.json({ error: "Invitation token is required" }, { status: 400 });
  const tokenHash = createHash("sha256").update(String(inviteToken)).digest("hex");
  const { data: invitation } = await supabaseAdmin.from("team_invitations").select("id,project_id,email,role,expires_at,accepted_at").eq("token_hash", tokenHash).single();
  if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (invitation.accepted_at) return NextResponse.json({ error: "Invitation already accepted" }, { status: 409 });
  if (new Date(invitation.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
  if (invitation.email.toLowerCase() !== auth.user.email.toLowerCase()) return NextResponse.json({ error: "Sign in with the invited email address" }, { status: 403 });
  const { error: memberError } = await supabaseAdmin.from("project_members").upsert({ project_id: invitation.project_id, user_id: auth.user.id, role: invitation.role }, { onConflict: "project_id,user_id" });
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });
  await supabaseAdmin.from("team_invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invitation.id);
  return NextResponse.json({ ok: true, projectId: invitation.project_id, role: invitation.role });
}
