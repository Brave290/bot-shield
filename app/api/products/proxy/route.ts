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

  const { data: configs, error } = await supabaseAdmin
    .from("proxy_configs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(configs || []);
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rateLimit = await checkRateLimit("proxy_configs", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "create-config") {
    const name = String(body.name || "").trim();
    const upstream = String(body.upstream_url || "").trim();
    if (!name) return NextResponse.json({ error: "Config name required" }, { status: 400 });
    if (!upstream || !/^https?:\/\//i.test(upstream)) return NextResponse.json({ error: "Invalid upstream URL" }, { status: 400 });

    const config = {
      user_id: user.id,
      name,
      upstream_url: upstream,
      method: ["GET", "POST", "PUT", "DELETE", "PATCH", "*"].includes(body.method) ? body.method : "*",
      headers: body.headers && typeof body.headers === "object" ? body.headers : {},
      rate_limit: Math.max(0, Number(body.rate_limit) || 0),
      timeout_ms: Math.max(1000, Math.min(300000, Number(body.timeout_ms) || 30000)),
      enabled: body.enabled !== false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("proxy_configs").insert(config).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "proxy.config_created", metadata: { config_id: data.id, name } });
    return NextResponse.json({ config: data });
  }

  if (action === "update-config") {
    const configId = String(body.config_id || "");
    if (!configId) return NextResponse.json({ error: "Config ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("proxy_configs").select("id").eq("id", configId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Config not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = String(body.name).trim();
    if (body.upstream_url) updates.upstream_url = String(body.upstream_url).trim();
    if (body.method) updates.method = body.method;
    if (body.headers) updates.headers = body.headers;
    if (body.rate_limit !== undefined) updates.rate_limit = Math.max(0, Number(body.rate_limit));
    if (body.timeout_ms !== undefined) updates.timeout_ms = Math.max(1000, Math.min(300000, Number(body.timeout_ms)));
    if (body.enabled !== undefined) updates.enabled = Boolean(body.enabled);

    const { data, error } = await supabaseAdmin.from("proxy_configs").update(updates).eq("id", configId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ config: data });
  }

  if (action === "delete-config") {
    const configId = String(body.config_id || "");
    if (!configId) return NextResponse.json({ error: "Config ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("proxy_configs").select("id").eq("id", configId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Config not found" }, { status: 404 });

    const { error } = await supabaseAdmin.from("proxy_configs").delete().eq("id", configId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const configId = new URL(req.url).searchParams.get("config_id") || "";
  if (!configId) return NextResponse.json({ error: "Config ID required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("proxy_configs").select("id").eq("id", configId).eq("user_id", user.id).single();
  if (!existing) return NextResponse.json({ error: "Config not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("proxy_configs").delete().eq("id", configId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
