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

  const [{ data: reports }, { data: controls }] = await Promise.all([
    supabaseAdmin
      .from("compliance_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("compliance_controls")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return NextResponse.json({ reports: reports || [], controls: controls || [] });
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rateLimit = await checkRateLimit("compliance", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "create-report") {
    const name = String(body.name || "").trim();
    const framework = String(body.framework || "").trim();
    if (!name || !framework) return NextResponse.json({ error: "Name and framework required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("compliance_reports")
      .insert({
        user_id: user.id,
        name,
        framework,
        status: "draft",
        summary: body.summary && typeof body.summary === "object" ? body.summary : {},
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ report: data });
  }

  if (action === "update-report") {
    const reportId = String(body.report_id || "");
    if (!reportId) return NextResponse.json({ error: "Report ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("compliance_reports").select("id").eq("id", reportId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = String(body.name).trim();
    if (body.framework) updates.framework = String(body.framework).trim();
    if (body.status) updates.status = body.status;
    if (body.summary) updates.summary = body.summary;

    const { data, error } = await supabaseAdmin.from("compliance_reports").update(updates).eq("id", reportId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ report: data });
  }

  if (action === "delete-report") {
    const reportId = String(body.report_id || "");
    if (!reportId) return NextResponse.json({ error: "Report ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("compliance_reports").select("id").eq("id", reportId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    await supabaseAdmin.from("compliance_controls").delete().eq("report_id", reportId);
    const { error } = await supabaseAdmin.from("compliance_reports").delete().eq("id", reportId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "upsert-control") {
    const reportId = String(body.report_id || "");
    const controlId = String(body.control_id || "").trim();
    if (!reportId || !controlId) return NextResponse.json({ error: "Report ID and control ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("compliance_reports").select("id").eq("id", reportId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const control = {
      user_id: user.id,
      report_id: reportId,
      control_id: controlId,
      name: String(body.name || "").trim(),
      status: ["pass", "fail", "partial", "not_applicable"].includes(body.status) ? body.status : "not_applicable",
      evidence: body.evidence && typeof body.evidence === "object" ? body.evidence : {},
      notes: String(body.notes || "").trim(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("compliance_controls")
      .upsert(control, { onConflict: "report_id,control_id" })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ control: data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
