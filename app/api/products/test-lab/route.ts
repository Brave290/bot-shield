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

  const [{ data: profiles }, { data: runs }] = await Promise.all([
    supabaseAdmin
      .from("test_lab_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("test_lab_runs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({ profiles: profiles || [], runs: runs || [] });
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rateLimit = await checkRateLimit("test_lab", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "create-profile") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Profile name required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("test_lab_profiles")
      .insert({
        user_id: user.id,
        name,
        description: String(body.description || "").trim(),
        config: body.config && typeof body.config === "object" ? body.config : {},
        enabled: body.enabled !== false,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  }

  if (action === "update-profile") {
    const profileId = String(body.profile_id || "");
    if (!profileId) return NextResponse.json({ error: "Profile ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("test_lab_profiles").select("id").eq("id", profileId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.config) updates.config = body.config;
    if (body.enabled !== undefined) updates.enabled = Boolean(body.enabled);

    const { data, error } = await supabaseAdmin.from("test_lab_profiles").update(updates).eq("id", profileId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  }

  if (action === "delete-profile") {
    const profileId = String(body.profile_id || "");
    if (!profileId) return NextResponse.json({ error: "Profile ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("test_lab_profiles").select("id").eq("id", profileId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    await supabaseAdmin.from("test_lab_runs").delete().eq("profile_id", profileId);
    const { error } = await supabaseAdmin.from("test_lab_profiles").delete().eq("id", profileId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "run-test") {
    const profileId = String(body.profile_id || "");
    if (!profileId) return NextResponse.json({ error: "Profile ID required" }, { status: 400 });

    const { data: profile } = await supabaseAdmin
      .from("test_lab_profiles")
      .select("*")
      .eq("id", profileId)
      .eq("user_id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from("test_lab_runs")
      .insert({
        user_id: user.id,
        profile_id: profileId,
        status: "running",
        config: profile.config,
        started_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "test_lab.run_started", metadata: { profile_id: profileId, run_id: data.id } });
    return NextResponse.json({ run: data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
