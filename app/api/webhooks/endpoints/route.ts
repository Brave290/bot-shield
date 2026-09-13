import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const CreateEndpointSchema = z.object({
  url: z.string().url("Must be a valid URL").refine((u) => u.startsWith("https://"), "URL must use HTTPS"),
  events: z.array(z.string()).min(1, "At least one event is required"),
  secret: z.string().min(16, "Secret must be at least 16 characters").optional(),
  active: z.boolean().optional().default(true),
  project_id: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  const activeOnly = searchParams.get("active") === "true";

  let query = supabaseAdmin.from("webhook_endpoints").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);
  if (activeOnly) query = query.eq("active", true);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const parsed = CreateEndpointSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("webhook_endpoints")
    .insert({
      url: parsed.data.url,
      events: parsed.data.events,
      secret: parsed.data.secret || null,
      active: parsed.data.active,
      project_id: parsed.data.project_id || null,
      created_by: admin.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "webhook_endpoint_created",
    target: data.id,
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
  if (!id) return NextResponse.json({ error: "Endpoint id is required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from("webhook_endpoints").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });

  const { error } = await supabaseAdmin.from("webhook_endpoints").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "webhook_endpoint_deleted",
    target: id,
  });

  return NextResponse.json({ ok: true });
}
