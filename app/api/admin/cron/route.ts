import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";

const JOB_NAME = "daily-maintenance";

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await supabaseAdmin
    .from("cron_job_history")
    .select("*")
    .eq("job_name", JOB_NAME)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: "Unable to load cron history" }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const start = Date.now();
  try {
    const res = await fetch(`${req.headers.get("origin") || "http://localhost:3000"}/api/cron/daily`, {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
        "x-botshield-trigger": `admin:${admin.email}`,
      },
    });
    const duration = Date.now() - start;
    const result = await res.json();
    return NextResponse.json({ ok: res.ok, duration_ms: duration, result });
  } catch (error) {
    await supabaseAdmin.from("cron_job_history").insert({
      job_name: JOB_NAME,
      triggered_by: admin.email,
      status: "error",
      duration_ms: Date.now() - start,
      result: { error: String(error) },
    });
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
