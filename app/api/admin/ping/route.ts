import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabaseAdmin.from("ping_history").select("*").order("created_at", { ascending: false }).limit(20);
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const start = Date.now();
  try {
    const res = await fetch(`${req.headers.get("origin") || "http://localhost:3000"}/api/cron/daily`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET || ""}` }
    });
    const duration = Date.now() - start;
    const result = await res.json();
    await supabaseAdmin.from("ping_history").insert({
      triggered_by: admin.email, status: res.ok ? "success" : "error",
      duration_ms: duration, result
    });
    return NextResponse.json({ ok: res.ok, duration_ms: duration, result });
  } catch (err) {
    await supabaseAdmin.from("ping_history").insert({
      triggered_by: admin.email, status: "error", duration_ms: Date.now() - start,
      result: { error: String(err) }
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
