import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const projectId = new URL(req.url).searchParams.get("projectId");
  const { data: project } = await supabaseAdmin.from("projects").select("id").eq("id", projectId).eq("user_id", auth.user.id).single();
  if (!project) return NextResponse.json({ error: "Only the project owner can view members" }, { status: 403 });
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabaseAdmin.from("project_members").select("id,user_id,role,created_at").eq("project_id", projectId),
    supabaseAdmin.from("team_invitations").select("id,email,role,expires_at,accepted_at,created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
  ]);
  return NextResponse.json({ members: members || [], invitations: invitations || [] });
}

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const projectId = String(body.projectId || "");
  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "developer");
  if (!projectId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "developer", "analyst", "viewer"].includes(role)) return NextResponse.json({ error: "Valid project, email, and role are required" }, { status: 400 });
  const { data: project } = await supabaseAdmin.from("projects").select("id,name").eq("id", projectId).eq("user_id", auth.user.id).single();
  if (!project) return NextResponse.json({ error: "Only the project owner can invite members" }, { status: 403 });
  const rawToken = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const { error } = await supabaseAdmin.from("team_invitations").insert({ project_id: projectId, email, role, token_hash: tokenHash, invited_by: auth.user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, inviteToken: rawToken, project: project.name, message: "Deliver this invitation token through your approved email flow." }, { status: 201 });
}
