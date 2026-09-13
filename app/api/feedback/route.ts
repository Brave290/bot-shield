import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { z } from "zod";

const SubmitFeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "improvement", "other"]),
  message: z.string().min(10, "Message must be at least 10 characters").max(2048),
  page: z.string().max(512).optional(),
});

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimit = await checkRateLimit("api_key", admin.email);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  let query = supabaseAdmin.from("feedback_entries").select("*").order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const ip = await getClientIP();
  const rateLimit = await checkRateLimit("contact_form", ip);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } });

  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  const userId = auth?.user?.id || null;

  const parsed = SubmitFeedbackSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("feedback_entries")
    .insert({
      user_id: userId,
      type: parsed.data.type,
      message: parsed.data.message,
      page: parsed.data.page || null,
      ip_hash: null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
