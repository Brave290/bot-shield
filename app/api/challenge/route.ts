import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createHash, randomUUID } from "crypto";
import { SignJWT } from "jose";
import { calculateBotScore, type BotPayload } from "@/lib/scoring-engine";
import { classifyBot } from "@/lib/bot-type";
import { z } from "zod";

const ChallengePayloadSchema = z.object({
  apiKey: z.string().min(1, "apiKey required"),
  mouseData: z.object({ distance: z.number().min(0), time: z.number().min(0), curves: z.number().min(0) }).optional().default({ distance: 0, time: 0, curves: 0 }),
  typingData: z.object({ totalChars: z.number().min(0), totalTime: z.number().min(0), backspaces: z.number().min(0) }).optional().default({ totalChars: 0, totalTime: 0, backspaces: 0 }),
  fingerprint: z.string().max(512).optional(),
  deviceData: z.object({ webdriver: z.boolean().optional(), touchPoints: z.number().min(0).optional(), hardwareConcurrency: z.number().min(0).optional(), platform: z.string().max(128).optional(), language: z.string().max(64).optional(), screen: z.string().max(64).optional() }).optional(),
  networkData: z.object({ connectionType: z.string().max(64).optional(), saveData: z.boolean().optional() }).optional(),
});

type ChallengePayload = z.infer<typeof ChallengePayloadSchema>;

function originAllowed(origin: string | null, allowedOrigins: string[]) {
  if (allowedOrigins.length === 0) return true;
  return Boolean(origin && allowedOrigins.includes(origin.replace(/\/$/, "")));
}

function decisionReasons(payload: ChallengePayload, score: number, botType: string) {
  const reasons: string[] = [];
  if ((payload.mouseData?.time || 0) < 500) reasons.push("limited_pointer_history");
  if ((payload.typingData?.totalChars || 0) > 0 && (payload.typingData?.totalTime || 0) / Math.max(1, payload.typingData?.totalChars || 1) < 25) reasons.push("rapid_typing");
  if (!payload.fingerprint) reasons.push("missing_fingerprint");
  if (payload.deviceData?.webdriver) reasons.push("webdriver_signal");
  if (botType !== "human") reasons.push("behavioral_risk");
  if (score >= 80) reasons.push("high_risk_score");
  return reasons.length ? reasons : ["normal_behavior"];
}

export async function POST(req: Request) {
  try {
    const requestId = randomUUID();
    const parsed = ChallengePayloadSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload schema" }, { status: 400 });
    const payload = parsed.data;
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id,user_id,api_key,secret_key,allowed_origins,allowed_ips,blocked_ips,mode,sensitivity,privacy_mode,consent_required")
      .eq("api_key", payload.apiKey)
      .single();
    if (projectError || !project) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    if (!originAllowed(req.headers.get("origin"), project.allowed_origins || [])) return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
    if (project.consent_required && req.headers.get("x-botshield-consent") !== "granted") return NextResponse.json({ error: "consent_required" }, { status: 428 });

    const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const ipHash = createHash("sha256").update(ip).digest("hex");
    if ((project.blocked_ips || []).includes(ip)) return NextResponse.json({ error: "ip_blocked" }, { status: 403 });

    const monthStart = new Date();
    monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const [{ data: subscription }, { data: accountProjects }] = await Promise.all([
      supabaseAdmin.from("subscription_stats").select("tier_name,status").eq("user_id", project.user_id).maybeSingle(),
      supabaseAdmin.from("projects").select("id").eq("user_id", project.user_id),
    ]);
    const tierName = subscription?.tier_name || "Hobby";
    const { data: plan } = await supabaseAdmin.from("plan_pricing").select("monthly_requests").eq("id", tierName).maybeSingle();
    const monthlyQuota = Number(plan?.monthly_requests ?? 1000);
    if (subscription?.status === "past_due" || subscription?.status === "canceled") return NextResponse.json({ error: "Subscription is not active" }, { status: 402 });
    if (monthlyQuota >= 0 && accountProjects?.length) {
      const { count } = await supabaseAdmin.from("verification_logs").select("id", { count: "exact", head: true }).in("project_id", accountProjects.map((item) => item.id)).gte("created_at", monthStart.toISOString());
      if ((count || 0) >= monthlyQuota) return NextResponse.json({ error: "Monthly request quota exceeded" }, { status: 429, headers: { "Retry-After": "3600" } });
    }

    const scopeKey = createHash("sha256").update(payload.apiKey).digest("hex");
    const { data: rawLimit } = await supabaseAdmin.rpc("consume_rate_limit", { p_limit_id: "api_key", p_scope_key: scopeKey }).maybeSingle();
    const limit = rawLimit as { allowed?: boolean; reset_in_seconds?: number } | null;
    if (limit && limit.allowed === false) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(limit.reset_in_seconds || 60) } });

    const score = calculateBotScore(payload as BotPayload);
    const botType = classifyBot(payload, score);
    const reasons = decisionReasons(payload, score, botType);
    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const storedFingerprint = project.privacy_mode === "strict" ? null : (payload.fingerprint || null);
    const token = await new SignJWT({ projectId: project.id, score, fingerprint: storedFingerprint, jti, iss: "botshield", aud: project.id, purpose: "bot_verification" })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m").sign(new TextEncoder().encode(project.secret_key));
    const { error: tokenError } = await supabaseAdmin.from("challenge_tokens").insert({ jti, project_id: project.id, score, fingerprint: storedFingerprint, expires_at: expiresAt });
    if (tokenError) throw tokenError;

    await supabaseAdmin.from("verification_logs").insert({ project_id: project.id, score, bot_type: botType, status: "issued", mode: project.mode || "active", ip_hash: ipHash, country: (req.headers.get("x-vercel-ip-country") || "unknown").toLowerCase(), browser_fingerprint: storedFingerprint, ip_address: ip, request_id: requestId, risk_reasons: reasons });
    const response = NextResponse.json({ token, score, botType, reasons, mode: project.mode || "active", requestId });
    response.headers.set("X-BotShield-Request-Id", requestId);
    return response;
  } catch (error) {
    console.error("[BotShield] Challenge error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
