import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

async function auth(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user || null;
}

export async function GET(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: targets, error } = await supabaseAdmin
    .from("scanner_targets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(targets || []);
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const ip = await getClientIP();
  const rateLimit = await checkRateLimit("scanner", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "create-target") {
    const url = String(body.url || "").trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid target URL" }, { status: 400 });
    }
    const name = String(body.name || "").trim() || url;
    const scanType = ["full", "quick", "ssl", "headers"].includes(body.scan_type) ? body.scan_type : "quick";

    const { data, error } = await supabaseAdmin
      .from("scanner_targets")
      .insert({
        user_id: user.id,
        name,
        url,
        scan_type: scanType,
        status: "idle",
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "scanner.target_created", metadata: { target_id: data.id, url } });
    return NextResponse.json({ target: data });
  }

  if (action === "update-target") {
    const targetId = String(body.target_id || "");
    if (!targetId) return NextResponse.json({ error: "Target ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from("scanner_targets")
      .select("id")
      .eq("id", targetId)
      .eq("user_id", user.id)
      .single();

    if (!existing) return NextResponse.json({ error: "Target not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = String(body.name).trim();
    if (body.url) updates.url = String(body.url).trim();
    if (body.scan_type && ["full", "quick", "ssl", "headers"].includes(body.scan_type)) updates.scan_type = body.scan_type;

    const { data, error } = await supabaseAdmin
      .from("scanner_targets")
      .update(updates)
      .eq("id", targetId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ target: data });
  }

  if (action === "delete-target") {
    const targetId = String(body.target_id || "");
    if (!targetId) return NextResponse.json({ error: "Target ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from("scanner_targets")
      .select("id")
      .eq("id", targetId)
      .eq("user_id", user.id)
      .single();

    if (!existing) return NextResponse.json({ error: "Target not found" }, { status: 404 });

    await supabaseAdmin.from("scanner_results").delete().eq("target_id", targetId);
    const { error } = await supabaseAdmin.from("scanner_targets").delete().eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "run-scan") {
    const targetId = String(body.target_id || "");
    if (!targetId) return NextResponse.json({ error: "Target ID required" }, { status: 400 });

    const { data: target } = await supabaseAdmin
      .from("scanner_targets")
      .select("*")
      .eq("id", targetId)
      .eq("user_id", user.id)
      .single();

    if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });

    await supabaseAdmin.from("scanner_targets").update({ status: "scanning", last_scan_at: new Date().toISOString() }).eq("id", targetId);

    const { data: result, error } = await supabaseAdmin
      .from("scanner_results")
      .insert({
        target_id: targetId,
        user_id: user.id,
        scan_type: target.scan_type,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      await supabaseAdmin.from("scanner_targets").update({ status: "error" }).eq("id", targetId);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "scanner.scan_started", metadata: { target_id: targetId, result_id: result.id } });
    return NextResponse.json({ result });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const targetId = new URL(req.url).searchParams.get("target_id") || "";
  if (!targetId) return NextResponse.json({ error: "Target ID required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("scanner_targets")
    .select("id")
    .eq("id", targetId)
    .eq("user_id", user.id)
    .single();

  if (!existing) return NextResponse.json({ error: "Target not found" }, { status: 404 });

  await supabaseAdmin.from("scanner_results").delete().eq("target_id", targetId);
  const { error } = await supabaseAdmin.from("scanner_targets").delete().eq("id", targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
