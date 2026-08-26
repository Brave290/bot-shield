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
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const allowedIps: string[] = project.allowed_ips || [];
    const blockedIps: string[] = project.blocked_ips || [];
    const mode = project.mode || "active";

    const signToken = async (score: number) => {
      const secret = new TextEncoder().encode(project.secret_key);
      return await new SignJWT({ projectId: project.id, score, iss: "botshield", aud: project.id, purpose: "bot_verification" })
        .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m").sign(secret);
    };

    if (blockedIps.includes(ip)) {
      await supabaseAdmin.from("verification_logs").insert({ project_id: project.id, score: 100, bot_type: "blacklisted", status: "blocked", mode, ip_hash: ipHash });
      return NextResponse.json({ status: "blocked", reason: "IP blacklisted" }, { status: 403 });
    }

    if (allowedIps.includes(ip)) {
      await supabaseAdmin.from("verification_logs").insert({ project_id: project.id, score: 0, bot_type: "whitelisted", status: "passed", mode, ip_hash: ipHash });
      const token = await signToken(0);
      return NextResponse.json({ status: "passed", token, score: 0, botType: "whitelisted", mode });
    }

    const cutoff = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await supabaseAdmin.from("rate_limit_events").select("*", { count: "exact", head: true }).eq("limit_id", "api_key").eq("scope_key", apiKey).gte("created_at", cutoff);
    await supabaseAdmin.from("rate_limit_events").insert({ limit_id: "api_key", scope_key: apiKey });
    if ((count || 0) >= 100) {
      return NextResponse.json({ status: "blocked", reason: "Rate limit exceeded (100/min)" }, { status: 429 });
    }

    let score = 50;
    try { score = calculateBotScore(payload); } catch { score = 50; }
    const botType = classifyBot(payload, score);
    const wouldBlock = score >= thresholdFor(project.sensitivity);
    const actuallyBlocked = mode === "active" && wouldBlock;

    const { error: logErr } = await supabaseAdmin.from("verification_logs").insert({ project_id: project.id, score, bot_type: botType, status: wouldBlock ? "blocked" : "passed", mode, ip_hash: ipHash });
    if (logErr) console.error("[BotShield] Log insert failed:", logErr);

    if (actuallyBlocked) return NextResponse.json({ status: "blocked", score, botType }, { status: 403 });

    const token = await signToken(score);
    return NextResponse.json({ status: "passed", token, score, botType, mode, shadowWouldBlock: wouldBlock });
  } catch (err) {
    console.error("[BotShield] Challenge error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
