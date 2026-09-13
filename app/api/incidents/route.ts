import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const CreateIncidentSchema = z.object({
  title: z.string().min(1, "Title is required").max(256),
  description: z.string().max(2048).optional().default(""),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "investigating", "resolved", "closed"]).optional().default("open"),
  project_id: z.string().uuid().optional(),
  affected_endpoints: z.array(z.string()).optional().default([]),
});

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const projectId = searchParams.get("project_id");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  let query = supabaseAdmin.from("incidents").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (severity) query = query.eq("severity", severity);
  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const parsed = CreateIncidentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("incidents")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      severity: parsed.data.severity,
      status: parsed.data.status,
      project_id: parsed.data.project_id || null,
      affected_endpoints: parsed.data.affected_endpoints,
      created_by: admin.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "incident_created",
    target: data.id,
  });

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Incident id is required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("incidents").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  const allowedFields: Record<string, unknown> = {};
  if (updates.title !== undefined) allowedFields.title = updates.title;
  if (updates.description !== undefined) allowedFields.description = updates.description;
  if (updates.severity !== undefined) allowedFields.severity = updates.severity;
  if (updates.status !== undefined) {
    allowedFields.status = updates.status;
    if (updates.status === "resolved") allowedFields.resolved_at = new Date().toISOString();
    if (updates.status === "closed") allowedFields.closed_at = new Date().toISOString();
  }
  if (updates.affected_endpoints !== undefined) allowedFields.affected_endpoints = updates.affected_endpoints;
  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin.from("incidents").update(allowedFields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "incident_updated",
    target: id,
  });

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Incident id is required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("incidents").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("incidents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "incident_deleted",
    target: id,
  });

  return NextResponse.json({ ok: true });
}
