import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const admin = await getAdmin(_req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("incidents").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: Params) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { id } = await params;
  const { data: existing } = await supabaseAdmin.from("incidents").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  const body = await req.json();
  const allowedFields: Record<string, unknown> = {};
  if (body.title !== undefined) allowedFields.title = body.title;
  if (body.description !== undefined) allowedFields.description = body.description;
  if (body.severity !== undefined) allowedFields.severity = body.severity;
  if (body.status !== undefined) {
    allowedFields.status = body.status;
    if (body.status === "resolved") allowedFields.resolved_at = new Date().toISOString();
    if (body.status === "closed") allowedFields.closed_at = new Date().toISOString();
  }
  if (body.affected_endpoints !== undefined) allowedFields.affected_endpoints = body.affected_endpoints;
  allowedFields.updated_at = new Date().toISOString();

  if (Object.keys(allowedFields).length <= 1) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabaseAdmin.from("incidents").update(allowedFields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "incident_updated",
    target: id,
  });

  return NextResponse.json(data);
}
