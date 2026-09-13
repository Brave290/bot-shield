import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const CreatePolicySchema = z.object({
  table_name: z.string().min(1, "Table name is required").max(128),
  retention_days: z.number().int().min(1).max(3650),
  delete_columns: z.array(z.string()).optional().default([]),
  archive_before_delete: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { data, error } = await supabaseAdmin.from("retention_policies").select("*").order("table_name");
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

  const { data: existing } = await supabaseAdmin
    .from("retention_policies")
    .select("id")
    .eq("table_name", parsed.data.table_name)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "A policy for this table already exists" }, { status: 409 });

  const { data, error } = await supabaseAdmin
    .from("retention_policies")
    .insert({
      table_name: parsed.data.table_name,
      retention_days: parsed.data.retention_days,
      delete_columns: parsed.data.delete_columns,
      archive_before_delete: parsed.data.archive_before_delete,
      enabled: parsed.data.enabled,
      created_by: admin.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "retention_policy_created",
    target: parsed.data.table_name,
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

  const { data: existing } = await supabaseAdmin.from("retention_policies").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

  const allowedFields: Record<string, unknown> = {};
  if (updates.retention_days !== undefined) allowedFields.retention_days = updates.retention_days;
  if (updates.delete_columns !== undefined) allowedFields.delete_columns = updates.delete_columns;
  if (updates.archive_before_delete !== undefined) allowedFields.archive_before_delete = updates.archive_before_delete;
  if (updates.enabled !== undefined) allowedFields.enabled = updates.enabled;
  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin.from("retention_policies").update(allowedFields).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "retention_policy_updated",
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

  const { data: existing } = await supabaseAdmin.from("retention_policies").select("id,table_name").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("retention_policies").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "retention_policy_deleted",
    target: existing.table_name,
  });

  return NextResponse.json({ ok: true });
}
