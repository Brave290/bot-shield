import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  const { count: total } = await supabaseAdmin.from("verification_logs").select("*", { count: "exact", head: true });
  const { count: blocked } = await supabaseAdmin.from("verification_logs").select("*", { count: "exact", head: true }).eq("status", "blocked");
  const { data: metrics } = await supabaseAdmin.from("request_metrics").select("id").limit(1);
  if (metrics && metrics.length) {
    await supabaseAdmin.from("request_metrics").update({ total_requests: total || 0, blocked_requests: blocked || 0, last_updated: new Date().toISOString() }).eq("id", metrics[0].id);
  } else {
    await supabaseAdmin.from("request_metrics").insert({ total_requests: total || 0, blocked_requests: blocked || 0 });
  }
  results.metrics = { total, blocked };

  const cutoff24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { error: e1 } = await supabaseAdmin.from("rate_limit_events").delete().lt("created_at", cutoff24);
  results.rateEventsPruned = !e1;

  const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error: e2 } = await supabaseAdmin.from("verification_logs").delete().lt("created_at", cutoff90);
  results.logsPruned = !e2;

  return NextResponse.json({ ok: true, ...results });
}
