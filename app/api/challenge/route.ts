import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { SignJWT } from "jose";
import { calculateBotScore } from "@/lib/scoring-engine";
import { classifyBot, thresholdFor } from "@/lib/bot-type";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { apiKey } = payload;
    if (!apiKey) return NextResponse.json({ error: "apiKey required" }, { status: 400 });

    const { data: project, error: projErr } = await supabaseAdmin.from("projects").select("*").eq("api_key", apiKey).single();
    if (projErr || !project) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // CRITICAL: Check IP blacklist/whitelist FIRST (bypasses everything else)
    const allowedIps: string[] = project.allowed_ips || [];
    const blockedIps: string[] = project.blocked_ips || [];
    if (blockedIps.includes(ip)) return NextResponse.json({ status: "blocked", reason: "IP blacklisted" }, { status: 403 });
    if (allowedIps.includes(ip)) {
      // Whitelisted: skip scoring, issue token immediately
      const secret = new TextEncoder().encode(project.secret_key);
      const token = await new SignJWT({ projectId: project.id, score: 0 }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m").sign(secret);
      return NextResponse.json({ status: "passed", token, score: 0, botType: "whitelisted", mode: "active" });
    }

    // TODO: Add rate limit check here before scoring (Critical #3)
    // For now, we proceed to scoring
    
    let score = 50;
    try { score = calculateBotScore(payload); } catch { score = 50; }
    
    const botType = classifyBot(payload, score);
    const wouldBlock = score >= thresholdFor(project.sensitivity);
    const mode = project.mode || "active";
    const actuallyBlocked = mode === "active" && wouldBlock;

    // CRITICAL: Explicit error handling for logging
    const { error: logErr } = await supabaseAdmin.from("verification_logs").insert({
      project_id: project.id, score, bot_type: botType,
      status: wouldBlock ? "blocked" : "passed", mode,
      ip_hash: createHash("sha256").update(ip).digest("hex"),
    });
    if (logErr) console.error("[BotShield] Log insert failed:", logErr);

    if (actuallyBlocked) {
      return NextResponse.json({ status: "blocked", score, botType }, { status: 403 });
    }

    const secret = new TextEncoder().encode(project.secret_key);
    const token = await new SignJWT({ projectId: project.id, score, iss: "botshield", aud: project.id, purpose: "bot_verification" })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m").sign(secret);

    return NextResponse.json({ status: "passed", token, score, botType, mode, shadowWouldBlock: wouldBlock });
  } catch (err) {
    console.error("[BotShield] Challenge endpoint error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
