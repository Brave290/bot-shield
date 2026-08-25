import { supabaseAdmin } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { createHash } from "crypto";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  limit: number;
}

export async function checkRateLimit(
  limitId: string,
  scopeValue: string
): Promise<RateLimitResult> {
  const { data: config } = await supabaseAdmin
    .from("rate_limits")
    .select("*")
    .eq("id", limitId)
    .single();

  if (!config || !config.enabled) {
    return { allowed: true, remaining: Infinity, resetInSeconds: 0, limit: Infinity };
  }

  const scopeKey = createHash("sha256").update(scopeValue).digest("hex");
  const windowStart = new Date(Date.now() - config.window_seconds * 1000);
  
  const { count } = await supabaseAdmin
    .from("rate_limit_events")
    .select("*", { count: "exact", head: true })
    .eq("limit_id", limitId)
    .eq("scope_key", scopeKey)
    .gte("created_at", windowStart.toISOString());

  const attempts = count || 0;
  const remaining = Math.max(0, config.max_attempts - attempts);
  const allowed = attempts < config.max_attempts;

  let resetInSeconds = 0;
  if (!allowed) {
    const { data: oldest } = await supabaseAdmin
      .from("rate_limit_events")
      .select("created_at")
      .eq("limit_id", limitId)
      .eq("scope_key", scopeKey)
      .gte("created_at", windowStart.toISOString())
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (oldest) {
      const oldestTime = new Date(oldest.created_at).getTime();
      resetInSeconds = Math.ceil((oldestTime + config.window_seconds * 1000 - Date.now()) / 1000);
    }
  }

  if (allowed) {
    await supabaseAdmin.from("rate_limit_events").insert({
      limit_id: limitId,
      scope_key: scopeKey,
    });
  }

  return { allowed, remaining, resetInSeconds, limit: config.max_attempts };
}

export async function getClientIP(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
