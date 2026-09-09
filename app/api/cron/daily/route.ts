import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getTrigger(req: Request) {
  const adminTrigger = req.headers.get("x-botshield-trigger");
  if (adminTrigger?.startsWith("admin:")) return adminTrigger;
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  if (userAgent.includes("cron-job.org")) return "cron-job.org";
  if (userAgent.includes("vercel-cron")) return "vercel-cron";
  return "scheduled-cron";
}

export async function GET(req: Request) {
  const startedAt = Date.now();
  const trigger = getTrigger(req);
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") || "";

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  let status: "success" | "error" = "success";

  try {
    const [totalResult, blockedResult] = await Promise.all([
      supabaseAdmin.from("verification_logs").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("verification_logs").select("id", { count: "exact", head: true }).eq("status", "blocked"),
    ]);
    if (totalResult.error) throw totalResult.error;
    if (blockedResult.error) throw blockedResult.error;

    const total = totalResult.count || 0;
    const blocked = blockedResult.count || 0;
    const { data: metrics, error: metricsReadError } = await supabaseAdmin.from("request_metrics").select("id").limit(1);
    if (metricsReadError) throw metricsReadError;

    if (metrics && metrics.length) {
      const { error } = await supabaseAdmin.from("request_metrics").update({ total_requests: total, blocked_requests: blocked, last_updated: new Date().toISOString() }).eq("id", metrics[0].id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("request_metrics").insert({ total_requests: total, blocked_requests: blocked });
      if (error) throw error;
    }
    results.metrics = { total, blocked };

    const cutoff24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { error: rateEventsError } = await supabaseAdmin.from("rate_limit_events").delete().lt("created_at", cutoff24);
    if (rateEventsError) throw rateEventsError;
    results.rateEventsPruned = true;

    const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { error: logsError } = await supabaseAdmin.from("verification_logs").delete().lt("created_at", cutoff90);
    if (logsError) throw logsError;
    results.logsPruned = true;

    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    status = "error";
    results.error = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, ...results }, { status: 500 });
  } finally {
    await supabaseAdmin.from("ping_history").insert({
      triggered_by: trigger,
      status,
      duration_ms: Date.now() - startedAt,
      result: results,
    });
  }
}
