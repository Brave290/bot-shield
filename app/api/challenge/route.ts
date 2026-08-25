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

    const { data: project } = await supabaseAdmin.from("projects").select("*").eq("api_key", apiKey).single();
    if (!project) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const allowedIps: string[] = project.allowed_ips || [];
    const blockedIps: string[] = project.blocked_ips || [];
    let forced: "allow" | "block" | null = null;
    if (allowedIps.includes(ip)) forced = "allow";
    else if (blockedIps.includes(ip)) forced = "block";

    let score = 50;
    try { score = calculateBotScore(payload); } catch { score = 50; }
    const botType = classifyBot(payload, score);
    const wouldBlock = forced === "block" ? true : forced === "allow" ? false : score >= thresholdFor(project.sensitivity);

    const mode = project.mode || "active";
    const actuallyBlocked = mode === "active" && wouldBlock;

    await supabaseAdmin.from("verification_logs").insert({
      project_id: project.id, score, bot_type: botType,
      status: wouldBlock ? "blocked" : "passed", mode,
      ip_hash: createHash("sha256").update(ip).digest("hex"),
    });

    if (actuallyBlocked) {
      return NextResponse.json({ status: "blocked", score, botType }, { status: 403 });
    }

    const secret = new TextEncoder().encode(project.secret_key);
    const token = await new SignJWT({ projectId: project.id, score })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("5m").sign(secret);

    return NextResponse.json({ status: "passed", token, score, botType, mode, shadowWouldBlock: wouldBlock });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
