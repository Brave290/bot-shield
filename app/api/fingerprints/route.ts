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
  const search = searchParams.get("search");
  const projectId = searchParams.get("project_id");
  const botType = searchParams.get("bot_type");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  let query = supabaseAdmin.from("fingerprint_history").select("*").order("created_at", { ascending: false });
  if (search) query = query.ilike("fingerprint", `%${search}%`);
  if (projectId) query = query.eq("project_id", projectId);
  if (botType) query = query.eq("bot_type", botType);

  const { data, error } = await query.limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
