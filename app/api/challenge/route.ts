import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { SignJWT } from "jose";
import { calculateBotScore } from "@/lib/scoring-engine";
import { classifyBot, thresholdFor } from "@/lib/bot-type";
import { z } from "zod";

// Validate incoming payload structure
const ChallengePayloadSchema = z.object({
  apiKey: z.string().min(1, "apiKey required"),
  mouseData: z.object({
    distance: z.number().min(0),
    time: z.number().min(0),
    curves: z.number().min(0),
  }),
  typingData: z.object({
    totalChars: z.number().min(0),
    totalTime: z.number().min(0),
    backspaces: z.number().min(0),
  }),
  fingerprint: z.string().optional(),
});

type ChallengePayload = z.infer<typeof ChallengePayloadSchema>;

export async function POST(req: Request) {
  try {
    const rawPayload = await req.json();
    
    // Validate payload schema
    let payload: ChallengePayload;
    try {
      payload = ChallengePayloadSchema.parse(rawPayload);
    } catch {
      return NextResponse.json(
        { error: "Invalid payload schema" },
        { status: 400 }
      );
    }

    const { apiKey } = payload;
    const { data: project, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("api_key", apiKey)
      .single();

    if (projErr || !project) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    const requestOrigin = req.headers.get("origin");
    const allowedOrigins: string[] = project.allowed_origins || [];
    if (requestOrigin && allowedOrigins.length > 0 && !allowedOrigins.includes(requestOrigin)) {
      return NextResponse.json({ error: "Origin is not allowed for this project" }, { status: 403 });
    }

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const country = (h.get("x-vercel-ip-country") || "unknown").toLowerCase();
    const allowedIps: string[] = project.allowed_ips || [];
    const blockedIps: string[] = project.blocked_ips || [];
    const mode = project.mode || "active";
    const recordMetric = (blocked: boolean) => supabaseAdmin.rpc("increment_request_metrics", { was_blocked: blocked });

    const signToken = async (score: number) => {
      const secret = new TextEncoder().encode(project.secret_key);
      return await new SignJWT({ 
        projectId: project.id, 
        score, 
        iss: "botshield", 
        aud: project.id, 
        purpose: "bot_verification" 
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(secret);
    };

    // Check IP blacklist
    if (blockedIps.includes(ip)) {
      await supabaseAdmin.from("verification_logs").insert({
        project_id: project.id,
        score: 100,
        bot_type: "blacklisted",
        status: "blocked",
        mode,
        ip_hash: ipHash,
        country,
      });
      await recordMetric(true);
      return NextResponse.json(
        { status: "blocked", reason: "IP blacklisted" },
        { status: 403 }
      );
    }

    // Check IP whitelist
    if (allowedIps.includes(ip)) {
      await supabaseAdmin.from("verification_logs").insert({
        project_id: project.id,
        score: 0,
        bot_type: "whitelisted",
        status: "passed",
        mode,
        ip_hash: ipHash,
        country,
      });
      await recordMetric(false);
      const token = await signToken(0);
      return NextResponse.json({
        status: "passed",
        token,
        score: 0,
        botType: "whitelisted",
        mode,
      });
    }

    // RATE LIMIT: Enforce with hardcoded defaults; fail closed on error
    const { data: rateConfig, error: rateErr } = await supabaseAdmin
      .from("rate_limits")
      .select("*")
      .eq("endpoint", "/api/challenge")
      .single();

    if (rateErr && rateErr.code !== "PGRST116") {
      // Unexpected error; fail closed
      console.error("[BotShield] Rate limit config error:", rateErr);
      return NextResponse.json(
        { error: "Rate limit check failed" },
        { status: 503 }
      );
    }

    const maxAttempts = rateConfig?.max_attempts || 100;
    const windowSeconds = rateConfig?.window_seconds || 60;

    const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { count, error: countErr } = await supabaseAdmin
      .from("rate_limit_events")
      .select("*", { count: "exact", head: true })
      .eq("limit_id", "api_key")
      .eq("scope_key", apiKey)
      .gte("created_at", cutoff);

    if (countErr) {
      console.error("[BotShield] Rate limit count error:", countErr);
      return NextResponse.json(
        { error: "Rate limit check failed" },
        { status: 503 }
      );
    }

    if ((count || 0) >= maxAttempts) {
      return NextResponse.json(
        {
          status: "blocked",
          reason: `Rate limit exceeded (${maxAttempts}/${windowSeconds}s)`,
        },
        { status: 429 }
      );
    }

    // Record rate limit event
    await supabaseAdmin.from("rate_limit_events").insert({
      limit_id: "api_key",
      scope_key: apiKey,
    });

    // Calculate bot score
    let score = 50;
    try {
      score = calculateBotScore(payload);
    } catch (err) {
      console.error("[BotShield] Scoring error:", err);
      score = 50; // Default to suspicious
    }

    const botType = classifyBot(payload, score);
    const wouldBlock = score >= thresholdFor(project.sensitivity);
    const actuallyBlocked = mode === "active" && wouldBlock;

    // Log verification attempt
    const { error: logErr } = await supabaseAdmin
      .from("verification_logs")
      .insert({
        project_id: project.id,
        score,
        bot_type: botType,
        status: actuallyBlocked ? "blocked" : "passed",
        mode,
        ip_hash: ipHash,
        country,
      });

    if (logErr) {
      console.error("[BotShield] Log insert failed:", logErr);
    }
    await recordMetric(actuallyBlocked);

    if (actuallyBlocked) {
      return NextResponse.json(
        { status: "blocked", score, botType },
        { status: 403 }
      );
    }

    const token = await signToken(score);
    return NextResponse.json({
      status: "passed",
      token,
      score,
      botType,
      mode,
      shadowWouldBlock: wouldBlock,
    });
  } catch (err) {
    console.error("[BotShield] Challenge error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
