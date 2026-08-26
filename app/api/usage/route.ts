import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const QUOTAS: Record<string, number> = { Hobby: 1000, Pro: 100000, Enterprise: -1 };

export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: projects } = await supabaseAdmin.from("projects").select("id").eq("user_id", auth.user.id);
  const ids = (projects || []).map((p) => p.id);
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  let today = 0, month = 0;
  if (ids.length) {
    const { count: t } = await supabaseAdmin.from("verification_logs").select("*", { count: "exact", head: true }).in("project_id", ids).gte("created_at", dayStart.toISOString());
    const { count: m } = await supabaseAdmin.from("verification_logs").select("*", { count: "exact", head: true }).in("project_id", ids).gte("created_at", monthStart.toISOString());
    today = t || 0; month = m || 0;
  }
  const { data: sub } = await supabaseAdmin.from("subscription_stats").select("tier_name").eq("user_id", auth.user.id).single();
  const tier = sub?.tier_name || "Hobby";
  const { data: rl } = await supabaseAdmin.from("rate_limits").select("*").eq("endpoint", "/api/challenge").single();
  return NextResponse.json({ today, month, tier, quota: QUOTAS[tier] ?? 1000, perMinute: rl?.max_attempts || 100, windowSeconds: rl?.window_seconds || 60 });
}
