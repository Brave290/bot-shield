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

  const [{ data: dashboards }, { data: filters }] = await Promise.all([
    supabaseAdmin
      .from("analytics_dashboards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("analytics_saved_filters")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({ dashboards: dashboards || [], filters: filters || [] });
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rateLimit = await checkRateLimit("analytics", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "create-dashboard") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Dashboard name required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("analytics_dashboards")
      .insert({
        user_id: user.id,
        name,
        description: String(body.description || "").trim(),
        widgets: body.widgets && Array.isArray(body.widgets) ? body.widgets : [],
        layout: body.layout && typeof body.layout === "object" ? body.layout : {},
        is_default: false,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ dashboard: data });
  }

  if (action === "update-dashboard") {
    const dashboardId = String(body.dashboard_id || "");
    if (!dashboardId) return NextResponse.json({ error: "Dashboard ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("analytics_dashboards").select("id").eq("id", dashboardId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.widgets) updates.widgets = body.widgets;
    if (body.layout) updates.layout = body.layout;

    const { data, error } = await supabaseAdmin.from("analytics_dashboards").update(updates).eq("id", dashboardId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ dashboard: data });
  }

  if (action === "delete-dashboard") {
    const dashboardId = String(body.dashboard_id || "");
    if (!dashboardId) return NextResponse.json({ error: "Dashboard ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("analytics_dashboards").select("id").eq("id", dashboardId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });

    const { error } = await supabaseAdmin.from("analytics_dashboards").delete().eq("id", dashboardId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "save-filter") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Filter name required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("analytics_saved_filters")
      .insert({
        user_id: user.id,
        name,
        config: body.config && typeof body.config === "object" ? body.config : {},
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ filter: data });
  }

  if (action === "delete-filter") {
    const filterId = String(body.filter_id || "");
    if (!filterId) return NextResponse.json({ error: "Filter ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("analytics_saved_filters").select("id").eq("id", filterId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Filter not found" }, { status: 404 });

    const { error } = await supabaseAdmin.from("analytics_saved_filters").delete().eq("id", filterId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
