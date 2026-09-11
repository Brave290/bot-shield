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
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", { p_limit_id: limitId, p_scope_key: scopeKey });
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result) return { allowed: false, remaining: 0, resetInSeconds: config.window_seconds, limit: config.max_attempts };
  return { allowed: Boolean(result.allowed), remaining: Number(result.remaining), resetInSeconds: Number(result.reset_in_seconds), limit: Number(result.rate_limit) };
}

export async function getClientIP(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
