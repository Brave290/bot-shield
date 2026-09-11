import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { jwtVerify } from "jose";
import { z } from "zod";
import { createHash, createHmac, randomUUID } from "crypto";
import { thresholdFor } from "@/lib/bot-type";

const VerifyPayloadSchema = z.object({ secretKey: z.string().min(1), token: z.string().min(1) });
const secretHash = (secret: string) => "hash:" + createHmac("sha256", "botshield-key-derivation").update(secret).digest("hex");

async function findProject(secretKey: string) {
  const hashed = await supabaseAdmin.from("projects").select("*").eq("secret_key", secretHash(secretKey)).maybeSingle();
  if (hashed.data) return { project: hashed.data, previous: false };
  const current = await supabaseAdmin.from("projects").select("*").eq("secret_key", secretKey).maybeSingle();
  if (current.data) return { project: current.data, previous: false };
  const previous = await supabaseAdmin.from("projects").select("*").eq("previous_secret_key", secretKey).maybeSingle();
  return previous.data ? { project: previous.data, previous: true } : null;
}

export async function POST(req: Request) {
  let payload: z.infer<typeof VerifyPayloadSchema>;
  try {
    const parsed = VerifyPayloadSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    payload = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const requestId = randomUUID();
    const h = await headers();
    const ip = (h.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const scopeKey = createHash("sha256").update(ip).digest("hex");
    const { data: rawLimit } = await supabaseAdmin.rpc("consume_rate_limit", { p_limit_id: "api_key", p_scope_key: scopeKey }).maybeSingle();
    const limit = rawLimit as { allowed?: boolean; reset_in_seconds?: number } | null;
    if (limit && limit.allowed === false) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(limit.reset_in_seconds || 60) } });

    const matched = await findProject(payload.secretKey);
    if (!matched) return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
    const { project, previous } = matched;
    if (!previous && project.secret_key_revoked_at) return NextResponse.json({ error: "Secret key has been revoked" }, { status: 401 });
    if (previous && (project.previous_secret_key_revoked_at || (project.previous_secret_key_expires_at && new Date(project.previous_secret_key_expires_at).getTime() < Date.now()))) return NextResponse.json({ error: "Previous secret key is no longer valid" }, { status: 401 });

    let jwtPayload;
    try {
      ({ payload: jwtPayload } = await jwtVerify(payload.token, new TextEncoder().encode(project.secret_key), { issuer: "botshield", audience: project.id, algorithms: ["HS256"] }));
    } catch {
      return NextResponse.json({ status: "blocked", score: 100, reason: "bad_token" });
    }
    if (jwtPayload.purpose !== "bot_verification" || typeof jwtPayload.jti !== "string") return NextResponse.json({ status: "blocked", score: 100, reason: "invalid_token" });

    const { data: challenge, error: challengeError } = await supabaseAdmin.from("challenge_tokens").select("jti,project_id,score,used_at,expires_at").eq("jti", jwtPayload.jti).eq("project_id", project.id).maybeSingle();
    if (challengeError) throw challengeError;
    if (!challenge || challenge.used_at || new Date(challenge.expires_at).getTime() <= Date.now()) return NextResponse.json({ status: "blocked", score: 100, reason: "replay_or_expired" });
    const { data: claimed, error: claimError } = await supabaseAdmin.from("challenge_tokens").update({ used_at: new Date().toISOString() }).eq("jti", challenge.jti).is("used_at", null).select("jti").maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return NextResponse.json({ status: "blocked", score: 100, reason: "replay" });

    const score = Number(challenge.score);
    const threshold = thresholdFor(project.sensitivity);
    const status = score >= threshold ? "blocked" : "human";
    await supabaseAdmin.from("verification_logs").insert({ project_id: project.id, score, status, bot_type: status === "blocked" ? "suspicious" : "human", mode: project.mode || "active", ip_hash: scopeKey, country: (h.get("x-vercel-ip-country") || "unknown").toLowerCase(), ip_address: ip, request_id: requestId, risk_reasons: status === "blocked" ? ["threshold_exceeded"] : ["below_threshold"] });
    await supabaseAdmin.rpc("increment_request_metrics", { was_blocked: status === "blocked" });
    const response = NextResponse.json({ status, score, requestId });
    response.headers.set("X-BotShield-Request-Id", requestId);
    return response;
  } catch (error) {
    console.error("[BotShield] Verify degraded", error);
    // Availability policy: do not lock out a customer when our control plane is unavailable.
    return NextResponse.json({ status: "human", degraded: true });
  }
}
