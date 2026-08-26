import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const range = new URL(req.url).searchParams.get("range") || "7d";
  const hours = range === "24h" ? 24 : range === "30d" ? 720 : 168;
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  const { data: projects } = await supabaseAdmin.from("projects").select("id,name").eq("user_id", auth.user.id);
  const ids = (projects || []).map((p) => p.id);
  if (!ids.length) return NextResponse.json({ projects: [], totals: { requests: 0, blocked: 0, humans: 0 }, daily: [], botTypes: [], countries: [], threats: [] });

  const { data: logs } = await supabaseAdmin.from("verification_logs")
    .select("score,bot_type,status,country,created_at")
    .in("project_id", ids).gte("created_at", since)
    .order("created_at", { ascending: false }).limit(2000);

  const rows = logs || [];
  const blocked = rows.filter((r) => r.status === "blocked").length;
  const totals = { requests: rows.length, blocked, humans: rows.length - blocked };

  const buckets = new Map<string, { requests: number; blocked: number }>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = range === "24h" ? d.getHours() + ":00" : d.toISOString().slice(0, 10);
    const b = buckets.get(key) || { requests: 0, blocked: 0 };
    b.requests++;
    if (r.status === "blocked") b.blocked++;
    buckets.set(key, b);
  }
  const daily = [...buckets.entries()].map(([label, v]) => ({ label, ...v })).reverse();

  const count = (fn: (r: any) => string) => {
    const m = new Map<string, number>();
    rows.forEach((r) => { const k = fn(r); m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count);
  };

  return NextResponse.json({
    projects,
    totals,
    daily,
    botTypes: count((r) => r.bot_type || "unknown").slice(0, 6),
    countries: count((r) => r.country || "unknown").slice(0, 5),
    threats: rows.filter((r) => r.status === "blocked").slice(0, 15),
  });
}
