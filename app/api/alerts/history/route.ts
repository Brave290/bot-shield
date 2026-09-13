import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policy_id");
  const severity = searchParams.get("severity");
  const acknowledged = searchParams.get("acknowledged");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  let query = supabaseAdmin.from("alert_history").select("*").order("created_at", { ascending: false });
  if (policyId) query = query.eq("policy_id", policyId);
  if (severity) query = query.eq("severity", severity);
  if (acknowledged === "true") query = query.not("acknowledged_at", "is", null);
  if (acknowledged === "false") query = query.is("acknowledged_at", null);

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function PATCH(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const body = await req.json();
  const { id, action } = body;

  if (!id) return NextResponse.json({ error: "Alert id is required" }, { status: 400 });
  if (action !== "acknowledge") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("alert_history").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("alert_history")
    .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: admin.email })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "alert_acknowledged",
    target: id,
  });

  return NextResponse.json(data);
}
