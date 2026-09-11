import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isSecurityFeatureKey, SECURITY_FEATURES } from "@/lib/security-features";

async function currentUser(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user || null;
}

async function ownedProject(projectId: string, userId: string) {
  const { data } = await supabaseAdmin.from("projects").select("id,name").eq("id", projectId).eq("user_id", userId).maybeSingle();
  return data;
}

export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const projectId = new URL(req.url).searchParams.get("projectId") || "";
  const project = await ownedProject(projectId, user.id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const { data: flags, error } = await supabaseAdmin.from("project_feature_flags").select("feature_key,enabled,config,updated_at").eq("project_id", projectId).limit(100);
  if (error) return NextResponse.json({ error: "Unable to load feature flags" }, { status: 500 });
  const configured = new Map((flags || []).map((flag) => [flag.feature_key, flag]));
  return NextResponse.json({ project, features: SECURITY_FEATURES.map((feature) => ({ ...feature, enabled: configured.get(feature.key)?.enabled ?? true, config: configured.get(feature.key)?.config ?? {} })) });
}

export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const projectId = String(body.project_id || "");
  const featureKey = String(body.feature_key || "");
  if (!isSecurityFeatureKey(featureKey)) return NextResponse.json({ error: "Unknown security feature" }, { status: 400 });
  const project = await ownedProject(projectId, user.id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const enabled = body.enabled !== false;
  const config = body.config && typeof body.config === "object" && !Array.isArray(body.config) ? body.config : {};
  const { data, error } = await supabaseAdmin.from("project_feature_flags").upsert({ project_id: projectId, feature_key: featureKey, enabled, config, updated_at: new Date().toISOString() }, { onConflict: "project_id,feature_key" }).select("feature_key,enabled,config,updated_at").single();
  if (error) return NextResponse.json({ error: "Unable to save feature flag" }, { status: 500 });
  await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "feature.updated", metadata: { project_id: projectId, feature_key: featureKey, enabled } });
  return NextResponse.json({ feature: data });
}
