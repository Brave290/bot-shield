import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

async function userFrom(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user || null;
}

const values = {
  privacy_mode: ["minimal", "standard", "strict"],
  risk_provider: ["none", "webhook"],
  accessibility_mode: ["review", "challenge", "allow"],
};

export async function GET(req: Request) {
  const user = await userFrom(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const projectId = new URL(req.url).searchParams.get("projectId") || "";
  const { data: project } = await supabaseAdmin.from("projects").select("id,name,fail_open,privacy_mode,consent_required,telemetry_retention_days,risk_provider,accessibility_mode").eq("id", projectId).eq("user_id", user.id).maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ settings: project });
}

export async function POST(req: Request) {
  const user = await userFrom(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const projectId = String(body.project_id || "");
  const { data: project } = await supabaseAdmin.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(values) as Array<keyof typeof values>) if (values[key].includes(body[key])) patch[key] = body[key];
  if (typeof body.fail_open === "boolean") patch.fail_open = body.fail_open;
  if (typeof body.consent_required === "boolean") patch.consent_required = body.consent_required;
  if (body.telemetry_retention_days !== undefined) {
    const retention = Number(body.telemetry_retention_days);
    if (!Number.isInteger(retention) || retention < 30 || retention > 730) return NextResponse.json({ error: "Retention must be between 30 and 730 days" }, { status: 400 });
    patch.telemetry_retention_days = retention;
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No valid settings supplied" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("projects").update(patch).eq("id", projectId).select("id,name,fail_open,privacy_mode,consent_required,telemetry_retention_days,risk_provider,accessibility_mode").single();
  if (error) return NextResponse.json({ error: "Unable to save security settings" }, { status: 500 });
  await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "project.security_settings_updated", metadata: { project_id: projectId, changed: Object.keys(patch) } });
  return NextResponse.json({ settings: data });
}
