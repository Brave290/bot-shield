import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const CreateExportSchema = z.object({
  type: z.enum(["verification_logs", "analytics", "incidents", "threat_lists", "fingerprints"]),
  format: z.enum(["csv", "json"]).optional().default("csv"),
  project_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

  let query = supabaseAdmin.from("export_jobs").select("*").order("created_at", { ascending: false }).eq("created_by", admin.email);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const parsed = CreateExportSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { data: recent } = await supabaseAdmin
    .from("export_jobs")
    .select("id")
    .eq("created_by", admin.email)
    .eq("status", "pending")
    .limit(5);

  if (recent && recent.length >= 5) {
    return NextResponse.json({ error: "You have too many pending exports. Wait for them to complete." }, { status: 429 });
  }

  const { data, error } = await supabaseAdmin
    .from("export_jobs")
    .insert({
      type: parsed.data.type,
      format: parsed.data.format,
      project_id: parsed.data.project_id || null,
      date_from: parsed.data.date_from || null,
      date_to: parsed.data.date_to || null,
      status: "pending",
      created_by: admin.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("audit_logs").insert({
    actor_email: admin.email,
    action: "export_created",
    target: data.id,
  });

  return NextResponse.json(data, { status: 201 });
}
