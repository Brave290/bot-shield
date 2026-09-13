import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

async function auth(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user || null;
}

export async function GET(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const targetId = url.searchParams.get("target_id") || "";
  const status = url.searchParams.get("status") || "";
  const scanType = url.searchParams.get("scan_type") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = supabaseAdmin
    .from("scanner_results")
    .select("*, scanner_targets(name, url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (targetId) query = query.eq("target_id", targetId);
  if (status) query = query.eq("status", status);
  if (scanType) query = query.eq("scan_type", scanType);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ results: data || [], total: count || 0 });
}
