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

  const { data: rules, error } = await supabaseAdmin
    .from("waf_rules")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(rules || []);
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rateLimit = await checkRateLimit("waf_rules", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "create-rule") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Rule name required" }, { status: 400 });

    const rule = {
      user_id: user.id,
      name,
      description: String(body.description || "").trim(),
      action: ["block", "allow", "challenge", "log"].includes(body.rule_action) ? body.rule_action : "block",
      priority: Math.max(0, Math.min(1000, Number(body.priority) || 100)),
      enabled: body.enabled !== false,
      conditions: body.conditions && typeof body.conditions === "object" ? body.conditions : {},
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from("waf_rules").insert(rule).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "waf.rule_created", metadata: { rule_id: data.id, name } });
    return NextResponse.json({ rule: data });
  }

  if (action === "update-rule") {
    const ruleId = String(body.rule_id || "");
    if (!ruleId) return NextResponse.json({ error: "Rule ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("waf_rules").select("id").eq("id", ruleId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = String(body.name).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.rule_action && ["block", "allow", "challenge", "log"].includes(body.rule_action)) updates.action = body.rule_action;
    if (body.priority !== undefined) updates.priority = Math.max(0, Math.min(1000, Number(body.priority)));
    if (body.enabled !== undefined) updates.enabled = Boolean(body.enabled);
    if (body.conditions && typeof body.conditions === "object") updates.conditions = body.conditions;

    const { data, error } = await supabaseAdmin.from("waf_rules").update(updates).eq("id", ruleId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rule: data });
  }

  if (action === "delete-rule") {
    const ruleId = String(body.rule_id || "");
    if (!ruleId) return NextResponse.json({ error: "Rule ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("waf_rules").select("id").eq("id", ruleId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    const { error } = await supabaseAdmin.from("waf_rules").delete().eq("id", ruleId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "toggle-rule") {
    const ruleId = String(body.rule_id || "");
    if (!ruleId) return NextResponse.json({ error: "Rule ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("waf_rules").select("id,enabled").eq("id", ruleId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

    const { data, error } = await supabaseAdmin.from("waf_rules").update({ enabled: !existing.enabled }).eq("id", ruleId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rule: data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const ruleId = new URL(req.url).searchParams.get("rule_id") || "";
  if (!ruleId) return NextResponse.json({ error: "Rule ID required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("waf_rules").select("id").eq("id", ruleId).eq("user_id", user.id).single();
  if (!existing) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("waf_rules").delete().eq("id", ruleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
