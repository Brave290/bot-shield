import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const CreatePolicySchema = z.object({
  name: z.string().min(1, "Name is required").max(128),
  metric: z.string().min(1, "Metric is required"),
  operator: z.enum(["gt", "lt", "gte", "lte", "eq"]),
  threshold: z.number(),
  window_minutes: z.number().int().min(1).max(1440),
  severity: z.enum(["info", "warning", "critical"]),
  notify_emails: z.array(z.string().email()).optional().default([]),
  project_id: z.string().uuid().optional(),
  enabled: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");

  let query = supabaseAdmin.from("alert_policies").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const parsed = CreatePolicySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("alert_policies")
    .insert({
      name: parsed.data.name,
      metric: parsed.data.metric,
      operator: parsed.data.operator,
      threshold: parsed.data.threshold,
      window_minutes: parsed.data.window_minutes,
      severity: parsed.data.severity,
      notify_emails: parsed.data.notify_emails,
      project_id: parsed.data.project_id || null,
      enabled: parsed.data.enabled,
      created_by: admin.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "alert_policy_created",
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
  if (!id) return NextResponse.json({ error: "Policy id is required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("alert_policies").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

  const allowedFields: Record<string, unknown> = {};
  if (updates.name !== undefined) allowedFields.name = updates.name;
  if (updates.metric !== undefined) allowedFields.metric = updates.metric;
  if (updates.operator !== undefined) allowedFields.operator = updates.operator;
  if (updates.threshold !== undefined) allowedFields.threshold = updates.threshold;
  if (updates.window_minutes !== undefined) allowedFields.window_minutes = updates.window_minutes;
  if (updates.severity !== undefined) allowedFields.severity = updates.severity;
  if (updates.notify_emails !== undefined) allowedFields.notify_emails = updates.notify_emails;
  if (updates.enabled !== undefined) allowedFields.enabled = updates.enabled;
  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin.from("alert_policies").update(allowedFields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "alert_policy_updated",
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
  if (!id) return NextResponse.json({ error: "Policy id is required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("alert_policies").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("alert_policies").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "alert_policy_deleted",
    target: id,
  });

  return NextResponse.json({ ok: true });
}
