import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

async function auth(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user || null;
}

export async function GET(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [{ data: deployments }, { data: logs }] = await Promise.all([
    supabaseAdmin
      .from("edge_deployments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("edge_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({ deployments: deployments || [], logs: logs || [] });
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rateLimit = await checkRateLimit("edge", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "create-deployment") {
    const name = String(body.name || "").trim();
    const region = String(body.region || "").trim();
    if (!name || !region) return NextResponse.json({ error: "Name and region required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("edge_deployments")
      .insert({
        user_id: user.id,
        name,
        region,
        config: body.config && typeof body.config === "object" ? body.config : {},
        status: "provisioning",
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "edge.deployment_created", metadata: { deployment_id: data.id, name, region } });
    return NextResponse.json({ deployment: data });
  }

  if (action === "update-deployment") {
    const deploymentId = String(body.deployment_id || "");
    if (!deploymentId) return NextResponse.json({ error: "Deployment ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("edge_deployments").select("id").eq("id", deploymentId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = String(body.name).trim();
    if (body.region) updates.region = String(body.region).trim();
    if (body.config) updates.config = body.config;
    if (body.status) updates.status = body.status;

    const { data, error } = await supabaseAdmin.from("edge_deployments").update(updates).eq("id", deploymentId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deployment: data });
  }

  if (action === "delete-deployment") {
    const deploymentId = String(body.deployment_id || "");
    if (!deploymentId) return NextResponse.json({ error: "Deployment ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("edge_deployments").select("id").eq("id", deploymentId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

    await supabaseAdmin.from("edge_logs").delete().eq("deployment_id", deploymentId);
    const { error } = await supabaseAdmin.from("edge_deployments").delete().eq("id", deploymentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "toggle-deployment") {
    const deploymentId = String(body.deployment_id || "");
    if (!deploymentId) return NextResponse.json({ error: "Deployment ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("edge_deployments").select("id,status").eq("id", deploymentId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

    const newStatus = existing.status === "active" ? "stopped" : "active";
    const { data, error } = await supabaseAdmin.from("edge_deployments").update({ status: newStatus }).eq("id", deploymentId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deployment: data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
