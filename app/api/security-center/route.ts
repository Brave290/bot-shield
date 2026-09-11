import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

async function auth(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user || null;
}

export async function GET(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const [{ data: projects }, { data: events }, { data: hooks }, { data: onboarding }, { data: alerts }, { data: schedules }, { data: mfa }] = await Promise.all([
    supabaseAdmin.from("projects").select("id,name,secret_key_rotated_at,secret_key_revoked_at").eq("user_id", user.id).limit(100),
    supabaseAdmin.from("security_events").select("id,event_type,metadata,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("webhook_subscriptions").select("id,endpoint_url,events,active,created_at,updated_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("onboarding_progress").select("completed").eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("login_alerts").select("id,ip_hash,user_agent,country,is_new_device,acknowledged_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("key_rotation_schedules").select("id,project_id,interval_days,grace_hours,enabled,next_rotation_at,last_rotated_at").eq("user_id", user.id).limit(100),
    supabaseAdmin.from("mfa_enrollments").select("method,status,enrolled_at").eq("user_id", user.id).maybeSingle(),
  ]);
  const projectIds = (projects || []).map((project) => project.id);
  const { data: policies } = projectIds.length ? await supabaseAdmin.from("project_policies").select("id,project_id,version,profile,threshold,action,challenge_type,created_at").in("project_id", projectIds).order("version", { ascending: false }).limit(100) : { data: [] };
  return NextResponse.json({ projects: projects || [], events: events || [], hooks: hooks || [], policies: policies || [], onboarding: onboarding?.completed || {}, alerts: alerts || [], schedules: schedules || [], mfa: mfa || null });
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "save-policy") {
    const projectId = String(body.project_id || "");
    const { data: project } = await supabaseAdmin.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const { data: latest } = await supabaseAdmin.from("project_policies").select("version").eq("project_id", projectId).order("version", { ascending: false }).limit(1).maybeSingle();
    const version = Number(latest?.version || 0) + 1;
    const { data, error } = await supabaseAdmin.from("project_policies").insert({ project_id: projectId, version, profile: ["strict", "balanced", "permissive"].includes(body.profile) ? body.profile : "balanced", threshold: Math.min(100, Math.max(0, Number(body.threshold) || 70)), action: ["block", "shadow", "challenge"].includes(body.policy_action) ? body.policy_action : "block", challenge_type: ["behavioral", "proof_of_work", "email"].includes(body.challenge_type) ? body.challenge_type : "behavioral", created_by: user.id }).select("*").single();
    if (error) return NextResponse.json({ error: "Unable to save policy" }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "policy.created", metadata: { project_id: projectId, version } });
    return NextResponse.json({ policy: data });
  }
  if (body.action === "rotate-key") {
    const projectId = String(body.project_id || "");
    const { data: project } = await supabaseAdmin.from("projects").select("id,secret_key").eq("id", projectId).eq("user_id", user.id).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const secretKey = `bs_sec_${randomBytes(24).toString("hex")}`;
    const { error } = await supabaseAdmin.from("projects").update({ previous_secret_key: project.secret_key, previous_secret_key_expires_at: new Date(Date.now() + 86400000).toISOString(), secret_key: secretKey, secret_key_rotated_at: new Date().toISOString(), secret_key_revoked_at: null }).eq("id", projectId);
    if (error) return NextResponse.json({ error: "Unable to rotate key" }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "key.rotated", metadata: { project_id: projectId } });
    return NextResponse.json({ secretKey, warning: "Copy this key now. It will not be shown again." });
  }
  if (body.action === "save-onboarding") {
    const completed = body.completed && typeof body.completed === "object" ? body.completed : {};
    await supabaseAdmin.from("onboarding_progress").upsert({ user_id: user.id, completed, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    return NextResponse.json({ completed });
  }
  if (body.action === "create-webhook") {
    const endpoint = String(body.endpoint_url || "").trim();
    if (!/^https:\/\//i.test(endpoint)) return NextResponse.json({ error: "Webhook URL must use HTTPS" }, { status: 400 });
    const secret = randomBytes(32).toString("hex");
    const { data, error } = await supabaseAdmin.from("webhook_subscriptions").insert({ user_id: user.id, endpoint_url: endpoint, secret_hash: createHash("sha256").update(secret).digest("hex"), events: Array.isArray(body.events) ? body.events : ["verification.blocked"] }).select("id,endpoint_url,events,active,created_at").single();
    if (error) return NextResponse.json({ error: "Unable to create webhook" }, { status: 500 });
    return NextResponse.json({ subscription: data, secret, warning: "Copy this signing secret now. It will not be shown again." });
  }
  if (body.action === "schedule-rotation") {
    const projectId = String(body.project_id || "");
    const intervalDays = [7, 30, 60, 90].includes(Number(body.interval_days)) ? Number(body.interval_days) : 30;
    const { data: project } = await supabaseAdmin.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).single();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const next = new Date(Date.now() + intervalDays * 86400000).toISOString();
    const { data, error } = await supabaseAdmin.from("key_rotation_schedules").upsert({ user_id: user.id, project_id: projectId, interval_days: intervalDays, grace_hours: Math.min(168, Math.max(1, Number(body.grace_hours) || 24)), enabled: body.enabled !== false, next_rotation_at: next }, { onConflict: "project_id" }).select("*").single();
    if (error) return NextResponse.json({ error: "Unable to schedule rotation" }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "key.rotation_scheduled", metadata: { project_id: projectId, interval_days: intervalDays } });
    return NextResponse.json({ schedule: data });
  }
  if (body.action === "enroll-mfa") {
    const method = ["totp", "passkey", "security_key"].includes(body.method) ? body.method : "totp";
    const { data, error } = await supabaseAdmin.from("mfa_enrollments").upsert({ user_id: user.id, method, status: "pending" }, { onConflict: "user_id" }).select("method,status,enrolled_at").single();
    if (error) return NextResponse.json({ error: "Unable to start MFA enrollment" }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "mfa.enrollment_started", metadata: { method } });
    return NextResponse.json({ enrollment: data, message: "MFA enrollment started. Complete verification in Supabase Auth before marking it enabled." });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
