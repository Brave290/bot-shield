import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const CreateEntrySchema = z.object({
  list_type: z.enum(["ip", "country", "asn"]),
  value: z.string().min(1, "Value is required").max(256),
  label: z.string().max(256).optional(),
  expires_at: z.string().datetime().optional(),
  project_id: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const listType = searchParams.get("list_type");
  const projectId = searchParams.get("project_id");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  let query = supabaseAdmin.from("threat_lists").select("*").order("created_at", { ascending: false });
  if (listType) query = query.eq("list_type", listType);
  if (projectId) query = query.eq("project_id", projectId);
  if (search) query = query.ilike("value", `%${search}%`);

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const parsed = CreateEntrySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("threat_lists")
    .select("id")
    .eq("list_type", parsed.data.list_type)
    .eq("value", parsed.data.value)
    .eq("project_id", parsed.data.project_id || null)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Entry already exists" }, { status: 409 });

  const { data, error } = await supabaseAdmin
    .from("threat_lists")
    .insert({
      list_type: parsed.data.list_type,
      value: parsed.data.value,
      label: parsed.data.label || null,
      expires_at: parsed.data.expires_at || null,
      project_id: parsed.data.project_id || null,
      created_by: admin.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: `threat_list_${parsed.data.list_type}_added`,
    target: parsed.data.value,
  });

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Entry id is required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("threat_lists").select("id,value,list_type").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("threat_lists").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: `threat_list_${existing.list_type}_removed`,
    target: existing.value,
  });

  return NextResponse.json({ ok: true });
}
